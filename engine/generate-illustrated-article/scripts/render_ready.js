#!/usr/bin/env node
/**
 * Prepare and publish one article screenshot as soon as its mockup is ready.
 *
 * The injector mutates step HTML in place, while later steps need the original
 * source (including <!-- INJECT_CSS --> and image tokens) for clone-and-edit.
 * This helper snapshots every authored step, injects the current set, validates
 * and renders one requested step, then restores all source HTML. The PNG is
 * rendered to a temporary path and renamed only after the quality, evidence,
 * and geometry gates pass, so observers never consume a half-written asset.
 *
 * Usage: render_ready.js <article_dir> <step_index> [project_root]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { puppeteer, launchOptions, renderOnBrowser, probeStringsFor } = require('./render_mockup.js');
const { actionMarkerFragments, fragmentShowsActionTarget, normalizeActionText, evidenceStrings } = require('./lint_mockup_fidelity.js');
const { verifyLabelEvidence } = require('./label_evidence.js');

function existingPath(candidates) {
    return candidates.find(candidate => fs.existsSync(candidate));
}

function evidenceForStep(articleDir, location) {
    try {
        const viewSources = JSON.parse(
            fs.readFileSync(path.join(articleDir, 'view_sources.json'), 'utf8')
        );
        const entries = viewSources.blocks || viewSources.steps || [];
        const step = entries.find(item => item.block_id === location || Number(item.index) === Number(location));
        return (step && step.verbatim_evidence || [])
            .map(item => typeof item === 'string' ? item : (item && item.string) || '')
            .filter(Boolean);
    } catch {
        return [];
    }
}

// The final lint's action-coverage checks for this one screenshot, run while its
// mockup is still being authored: each target shown here sits inside an element
// marked for its article block and is quoted in this block's verbatim_evidence.
function actionTargetProblems(articleDir, location, html, projectRoot) {
    let vs;
    try { vs = JSON.parse(fs.readFileSync(path.join(articleDir, 'view_sources.json'), 'utf8')); } catch { return []; }
    const entries = vs.blocks || vs.steps || [];
    const step = entries.find(item => item.block_id === location || Number(item.index) === Number(location));
    // A block's marker may be its id or its section's position in article.json,
    // as the lint numbers them.
    const position = new Map();
    try {
        const article = JSON.parse(fs.readFileSync(path.join(articleDir, 'article.json'), 'utf8'));
        (article.blocks || []).filter(block => block && block.type === 'section').forEach((block, i) => position.set(block.id, i));
    } catch { /* no article yet */ }
    const problems = [];
    for (const evidence of (step && Array.isArray(step.verbatim_evidence) ? step.verbatim_evidence : [])) {
        const verified = verifyLabelEvidence(evidence, step.primary_view, projectRoot);
        if (!verified.ok) problems.push(verified.error);
    }
    for (const entry of Array.isArray(vs.action_coverage) ? vs.action_coverage : []) {
        if (!entry || (entry.screenshot_block_id ?? entry.screenshot_step_index) != location) continue;
        const target = typeof entry.target === 'string' ? entry.target.trim() : '';
        const marker = entry.article_block_id ?? entry.article_step_index;
        if (!target || marker == null) continue;
        const fragments = [...actionMarkerFragments(html, marker),
            ...(position.has(marker) ? actionMarkerFragments(html, position.get(marker)) : [])];
        if (!fragments.length) problems.push(`no element carries data-rtfm-action-target="${marker}" — mark the control for "${target}"`);
        else if (!fragments.some(fragment => fragmentShowsActionTarget(fragment, target))) problems.push(
            `"${target}" is not inside (or the label of) an element marked data-rtfm-action-target="${marker}" — ` +
            'mark that control too (several controls may share one marker)');
        if (step && !evidenceStrings(step).some(value => normalizeActionText(value) === normalizeActionText(target))) problems.push(
            `"${target}" is missing from this block's verbatim_evidence — add it, as the literal a cited source file (or its locale file) holds`);
    }
    return problems;
}

// The copy lint's errors for this block (bold labels and code its own sources
// lack), from the same check the post-process runs.
function copyLintProblems(articleDir, location, projectRoot) {
    if (/^\d+$/.test(String(location))) return [];
    const result = spawnSync(process.execPath, [path.join(__dirname, 'lint_article_copy.js'), articleDir, projectRoot],
        { cwd: projectRoot, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, env: { ...process.env, RTFM_LINT_MODE: '' } });
    const prefix = `[FAIL] block ${location}: `;
    return String(result.stdout || '').split('\n').filter(line => line.startsWith(prefix)).map(line => line.slice(prefix.length));
}

function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        ...options,
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`${path.basename(command)} exited with status ${result.status}`);
    }
    return result;
}

async function main() {
    const articleDir = path.resolve(process.argv[2] || '');
    const rawIndex = process.argv[3];
    const projectRoot = path.resolve(process.argv[4] || process.cwd());
    if (!articleDir || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawIndex || '') || !fs.existsSync(articleDir)) {
        throw new Error('Usage: render_ready.js <article_dir> <block_id|step_index> [project_root]');
    }

    const legacy = /^\d+$/.test(rawIndex);
    const index = legacy ? Number(rawIndex) : null;
    const stepName = legacy ? `step_${index}` : `block_${rawIndex}`;
    const htmlPath = path.join(articleDir, `${stepName}.html`);
    const finalPng = path.join(articleDir, `${stepName}.png`);
    const finalDiagnostics = path.join(articleDir, `${stepName}_diagnostics.json`);
    if (!fs.existsSync(htmlPath)) throw new Error(`Missing ${htmlPath}`);

    const authoredHtml = fs.readdirSync(articleDir)
        .filter(name => /^(?:step_\d+|block_[a-z0-9]+(?:-[a-z0-9]+)*)\.html$/.test(name))
        .map(name => path.join(articleDir, name));
    const originals = new Map(
        authoredHtml.map(file => [file, fs.readFileSync(file, 'utf8')])
    );

    const brandDir = existingPath([
        path.join(projectRoot, '.rtfm', 'branding.json'),
        path.join(projectRoot, '.rtfm-branding', 'branding.json'),
    ]);
    const brandingJson = brandDir || null;
    const brandingCss = brandingJson
        ? path.join(path.dirname(brandingJson), 'branding.css')
        : null;
    if (brandingCss && fs.existsSync(brandingCss)) {
        fs.copyFileSync(brandingCss, path.join(articleDir, 'branding.css'));
    }

    const imagesJson = existingPath([
        path.join(projectRoot, '.rtfm', 'images_base64.json'),
        path.join(projectRoot, '.rtfm-branding', 'images_base64.json'),
    ]) || path.join(projectRoot, '.rtfm', 'images_base64.json');
    const generatedImages = path.join(articleDir, 'generated_images.json');
    const injectArgs = [
        path.join(__dirname, 'inject_assets.js'), articleDir, '', imagesJson,
    ];
    if (brandingJson) injectArgs.push('--branding', brandingJson);
    if (fs.existsSync(generatedImages)) {
        injectArgs.push('--generated-images', generatedImages);
    }
    injectArgs.push('--refresh-jit');

    const targetProblems = [
        ...actionTargetProblems(articleDir, legacy ? index : rawIndex, originals.get(htmlPath) || '', projectRoot).map(p => `(view_sources) ${p}`),
        ...copyLintProblems(articleDir, legacy ? index : rawIndex, projectRoot).map(p => `(article copy) ${p}`),
    ];
    const tempPng = path.join(articleDir, `.${stepName}.rendering-${process.pid}.png`);
    const tempDiagnostics = tempPng.replace(/\.png$/, '_diagnostics.json');
    let browser;
    try {
        run(process.execPath, injectArgs, { cwd: projectRoot });

        const validation = spawnSync(process.execPath, [
            path.join(__dirname, 'validate_html.js'), htmlPath,
        ], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
        const validationText = `${validation.stdout || ''}${validation.stderr || ''}`;
        fs.writeFileSync(path.join(articleDir, `${stepName}_validation.json`), validationText);
        if (validation.error) throw validation.error;
        if (validation.status !== 0) {
            throw new Error(`${stepName}.html is not ready: HTML validation failed`);
        }

        const evidence = evidenceForStep(articleDir, legacy ? index : rawIndex);
        let viewSources = null;
        try { viewSources = JSON.parse(fs.readFileSync(path.join(articleDir, 'view_sources.json'), 'utf8')); } catch { /* optional */ }
        const probe = probeStringsFor(projectRoot, viewSources, legacy ? index : rawIndex, evidence);
        browser = await puppeteer.launch(launchOptions());
        const started = Date.now();
        const diagnostics = await renderOnBrowser(browser, tempPng, htmlPath, { evidence, probe });
        const quality = diagnostics.qualityScore || {};
        const invisibleEvidence = ((diagnostics.metrics || {}).evidenceVisibility || [])
            .filter(item => !item.visible).map(item => item.string);
        const evidenceChecked = ((diagnostics.metrics || {}).evidenceVisibility || []).length;
        const geometryErrors = (((diagnostics.metrics || {}).regionGeometry || {}).errors || []);

        if (quality.rating === 'poor') {
            throw new Error(`${stepName} rendered POOR (score ${quality.score})`);
        }
        if (evidenceChecked && invisibleEvidence.length * 2 > evidenceChecked) {
            throw new Error(`${stepName} hides ${invisibleEvidence.length}/${evidenceChecked} evidence strings`);
        }
        if (geometryErrors.length) {
            throw new Error(`${stepName} violates runtime geometry: ${geometryErrors.join('; ')}`);
        }

        fs.renameSync(tempPng, finalPng);
        fs.renameSync(tempDiagnostics, finalDiagnostics);
        fs.writeFileSync(path.join(articleDir, `${stepName}_progress.json`), JSON.stringify({
            ...(legacy ? { step_index: index } : { block_id: rawIndex }),
            published: true,
            render_ms: Date.now() - started,
            quality: quality.rating,
            score: quality.score,
        }, null, 2));
        console.log(`Published ${path.basename(finalPng)} progressively (quality: ${quality.rating}, ${quality.score})`);
    } finally {
        // stdout, after the render result: the final lint fails each of these
        for (const problem of targetProblems) console.log(`FIX NOW ${stepName} ${problem} — the final lint fails this`);
        if (browser) await browser.close();
        for (const [file, contents] of originals) fs.writeFileSync(file, contents);
        for (const temporary of [tempPng, tempDiagnostics]) {
            try { fs.unlinkSync(temporary); } catch { /* already published or absent */ }
        }
    }
}

main().catch(error => {
    console.error(`render_ready failed: ${error.message}`);
    process.exit(1);
});
