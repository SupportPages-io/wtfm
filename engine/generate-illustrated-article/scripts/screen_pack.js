#!/usr/bin/env node
'use strict';
// screen_pack.js — one call that prints the source a screen is built from, so the
// article skill reads a flow in one turn instead of one file per turn.
//
//   node screen_pack.js [--depth N] [--max-bytes N] [--locale CODE] <view_file>...
//   node screen_pack.js --shell [<layout path | layout name | route key>]
//
// For each view file (repo-relative, run from the repo root) it walks the include
// tree breadth-first with the shared include_census resolver (ERB partials and
// ViewComponents, JSX/Vue/Svelte imports through aliases and workspace packages,
// Blade, Django/Jinja, Razor, Angular selectors …) and prints every file's markup:
// the <template> of a Vue/Svelte single-file component, a JSX file without its
// import lines, a template as is. Depth 0 is the view alone; the default 2 covers
// the view and the components it composes. Then it prints the UI strings those
// files reference (`t('…')`, `$t("…")`, `I18n.t`, `t(".key")`, `__('…')`, `{% trans %}`)
// resolved against the product's own locale files for --locale (default en), so
// labels need no lookups either, and inline SVGs for the icons those files name
// (resolved like `mockup_kit.js icons`). Anything past --max-bytes is listed by
// path for a selective Read. Until the run's article.json exists it ends with a
// NEXT line: the flow is all Phase 1 needs.
//
// --shell prints the app chrome every in-app mockup shares, once: the map's
// app_shell and the layout's root classes / runtime chrome, the markup of the
// layout and every file in its `chrome` list, their UI strings and icons, and the
// logo candidates in the image manifest. Output stays under Claude Code's 30k
// display cap. Dependency-free; always exits 0.

const fs = require('fs');
const path = require('path');
const census = require('./include_census.js');
const { findLocaleFiles } = require('./find_locale_files.js');
const { resolveIcon } = require('./mockup_kit.js');

const SKIP_EXT_RE = /\.(?:json|ya?ml|arb|po|css|scss|sass|less|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|md|txt|lock|d\.ts)$/i;
const SKIP_PATH_RE = /(?:^|\/)(?:node_modules|vendor|dist|build|\.next|\.svelte-kit|test|tests|__tests__|spec|stories?)\//;
const PER_FILE_MAX = 9000;

function args() {
    const argv = process.argv.slice(2);
    const opt = (name, dflt) => {
        const i = argv.indexOf(name);
        return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : dflt;
    };
    const flags = new Set(['--depth', '--max-bytes', '--locale']);
    const views = argv.filter((a, i) => !a.startsWith('--') && !flags.has(argv[i - 1]));
    return {
        views,
        shell: argv.includes('--shell'),
        depth: Math.max(0, parseInt(opt('--depth', '2'), 10) || 0),
        maxBytes: Math.max(4000, parseInt(opt('--max-bytes', '18000'), 10) || 18000),
        locale: String(opt('--locale', 'en') || 'en'),
    };
}

function read(root, rel) {
    try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch { return null; }
}

// The part of a file that paints the screen.
function markup(rel, text) {
    const ext = path.extname(rel).toLowerCase();
    if (ext === '.vue' || ext === '.svelte') {
        const m = text.match(/<template\b[^>]*>([\s\S]*)<\/template>/i);
        if (m) return m[0];
        return text.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').trim();
    }
    if (['.tsx', '.jsx', '.ts', '.js', '.mjs'].includes(ext)) {
        return text.split('\n').filter(line => !/^\s*(import\b|export\s+\*\s+from|\/\/)/.test(line)).join('\n').trim();
    }
    return text.trim();
}

// Auto-imported single-file components (Nuxt `components/`, unplugin-vue-components):
// a template tag with no import, matched to a component file by basename.
let componentIndex = null;
function autoImported(root, rel, refs) {
    if (!/\.(vue|svelte)$/i.test(rel)) return [];
    if (!componentIndex) {
        componentIndex = new Map();
        let files = [];
        try {
            files = require('child_process').execFileSync('git', ['ls-files', '*.vue', '*.svelte'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32 * 1024 * 1024 }).split('\n');
        } catch { files = []; }
        for (const f of files) {
            if (!f || SKIP_PATH_RE.test(f) || !/(^|\/)components\//.test(f)) continue;
            const base = path.basename(f).replace(/\.(vue|svelte)$/, '');
            if (!componentIndex.has(base)) componentIndex.set(base, f);
        }
    }
    const text = read(root, rel) || '';
    const tpl = (text.match(/<template\b[^>]*>([\s\S]*)<\/template>/i) || [null, text])[1];
    const known = new Set(refs.map(r => r.name));
    const found = [];
    for (const m of tpl.matchAll(/<([A-Z][A-Za-z0-9]+|[a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b/g)) {
        const tag = m[1];
        const pascal = tag.includes('-') ? tag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') : tag;
        if (known.has(tag) || known.has(pascal)) continue;
        const file = componentIndex.get(pascal);
        if (file && file !== rel) {
            known.add(pascal);
            found.push({ name: pascal, file, overlay: census.OVERLAY_NAME_RE.test(pascal), guarded: false });
        }
    }
    return found;
}

function walk(root, views, maxDepth) {
    const out = [];
    const seen = new Set();
    const queue = views.map(file => ({ file, depth: 0, via: null, kind: 'view' }));
    while (queue.length) {
        const item = queue.shift();
        if (seen.has(item.file)) continue;
        seen.add(item.file);
        out.push(item);
        if (item.depth >= maxDepth) continue;
        let refs = [];
        try { refs = census.includeRefs(root, item.file); } catch { refs = []; }
        refs = refs.concat(autoImported(root, item.file, refs));
        for (const ref of refs) {
            if (!ref.file || SKIP_EXT_RE.test(ref.file) || SKIP_PATH_RE.test(ref.file) || seen.has(ref.file)) continue;
            let kind = ref.overlay ? 'overlay' : (ref.guarded ? 'conditional' : 'unconditional');
            if (item.kind === 'overlay' && kind === 'unconditional') kind = 'overlay';
            if (item.kind === 'conditional' && kind === 'unconditional') kind = 'conditional';
            queue.push({ file: ref.file, depth: item.depth + 1, via: item.file, kind });
        }
    }
    return out;
}

// ---- UI strings ---------------------------------------------------------------

const KEY_RES = [
    /(?:\$t|\bt|\btc|\bi18n\.t|\bI18n\.t|\$i18n\.t|\btranslate|\bintl\.formatMessage)\(\s*['"`]([\w.:\-/]+)['"`]/g,
    /\b__\(\s*['"]([\w.:\-/]+)['"]/g,
    /\{%\s*trans\s+['"]([^'"]+)['"]/g,
    /\bv-t=["']['"]?([\w.\-]+)/g,
];

function keysIn(text) {
    const keys = new Set();
    for (const re of KEY_RES) for (const m of text.matchAll(re)) keys.add(m[1]);
    return keys;
}

function flatten(obj, prefix, out) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
    } else if (typeof obj === 'string') {
        out.set(prefix, obj);
    }
    return out;
}

// Indentation-scoped "key: value" lines — enough for Rails/Symfony locale YAML.
function flattenYaml(text, out) {
    const stack = [];
    for (const raw of text.split('\n')) {
        if (!raw.trim() || /^\s*#/.test(raw)) continue;
        const m = raw.match(/^(\s*)(['"]?)([^:'"]+)\2\s*:\s*(.*)$/);
        if (!m) continue;
        const indent = m[1].length;
        while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
        const value = m[4].trim();
        if (value && value !== '|' && value !== '>') {
            const key = [...stack.map(s => s.key), m[3].trim()].join('.');
            out.set(key, value.replace(/^(['"])(.*)\1$/, '$2'));
        } else {
            stack.push({ indent, key: m[3].trim() });
        }
    }
    return out;
}

function catalogue(root, locale) {
    let found;
    try { found = findLocaleFiles(root, locale); } catch { return new Map(); }
    const files = (found.has_locale ? found.target_files : found.default_files) || [];
    const table = new Map();
    for (const rel of files.slice(0, 80)) {
        const text = read(root, rel);
        if (!text) continue;
        try {
            if (/\.json$/i.test(rel)) {
                const flat = flatten(JSON.parse(text), '', new Map());
                // Namespaced files (inboxMgmt.json, en/settings.json) are often looked up without the file stem.
                for (const [k, v] of flat) table.set(k, v);
            } else if (/\.ya?ml$/i.test(rel)) {
                const flat = flattenYaml(text, new Map());
                for (const [k, v] of flat) table.set(k.replace(new RegExp(`^${locale}[\\w-]*\\.`), ''), v);
            }
        } catch { /* unparseable file: skip */ }
    }
    return table;
}

function lookup(table, key, viewFile) {
    if (table.has(key)) return table.get(key);
    // Rails lazy lookup: t(".save") in app/views/users/edit.html.erb → users.edit.save.
    if (key.startsWith('.') && viewFile) {
        const scope = viewFile.replace(/^app\/views\//, '').replace(/\.[\w.]+$/, '').replace(/\/_?/g, '.');
        if (table.has(scope + key)) return table.get(scope + key);
    }
    const tail = key.replace(/^[\w-]+:/, '');
    if (table.has(tail)) return table.get(tail);
    for (const [k, v] of table) if (k.endsWith(`.${tail}`)) return v;
    return null;
}

// ---- icons --------------------------------------------------------------------

// Iconify sets worth an `npm pack` when not installed; anything else must be local.
const FETCHABLE_SETS = new Set(['lucide', 'mdi', 'tabler', 'heroicons', 'ph', 'ri', 'bi', 'material-symbols', 'ic', 'carbon',
    'fluent', 'solar', 'mingcute', 'octicon', 'radix-icons', 'iconoir', 'la', 'fa6-solid', 'fa6-regular', 'akar-icons', 'simple-icons']);
const MULTIWORD_SETS = ['material-symbols', 'radix-icons', 'akar-icons', 'simple-icons', 'fa6-solid', 'fa6-regular', 'heroicons-outline', 'heroicons-solid'];
const NOT_ICONS = /^Icon(?:Button|Props|Type|Component|Container|Wrapper|Size|Color|Name|Map|Registry|Provider|Context|Display|Picker|Select|Input|Link|Label|Group|List|Menu|Base|Svg)\b|^(?:Svg|Base|Custom|App|Nav|Menu|Status)Icon$/;

function iconSpecs(text) {
    const specs = new Set();
    const add = s => { if (s && s.length < 60) specs.add(s); };
    for (const m of text.matchAll(/(?<![\w-])i-([a-z0-9]+(?:-[a-z0-9]+)+)/g)) {
        const rest = m[1];
        const multi = MULTIWORD_SETS.find(set => rest.startsWith(set + '-'));
        add(multi ? `${multi}:${rest.slice(multi.length + 1)}` : `i-${rest}`);
    }
    for (const m of text.matchAll(/["'`]([a-z][a-z0-9]*(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)["'`]/g)) {
        if (FETCHABLE_SETS.has(m[1])) add(`${m[1]}:${m[2]}`);
    }
    for (const m of text.matchAll(/(?<![\w-])mdi-([a-z0-9]+(?:-[a-z0-9]+)*)/g)) add(`mdi:${m[1]}`);
    for (const m of text.matchAll(/\b(mdi[A-Z]\w+)\b/g)) add(m[1]);
    for (const m of text.matchAll(/(?<![\w-])bi-([a-z0-9]+(?:-[a-z0-9]+)*)/g)) add(`bi:${m[1]}`);
    for (const m of text.matchAll(/<(i-bs|[\w-]*icon[\w-]*)\b[^>]*?\s:?(?:name|icon)=["']'?([a-z0-9]+(?:[-:][a-z0-9]+)*)'?["']/gi)) {
        if (m[2].includes(':')) add(m[2]);
        else if (m[1].toLowerCase() === 'i-bs') add(`bi:${m[2]}`);
    }
    for (const m of text.matchAll(/\b((?:Icon|Lucide)[A-Z]\w+|[A-Z]\w+Icon)\b/g)) if (!NOT_ICONS.test(m[1])) add(m[1]);
    for (const m of text.matchAll(/\b(?:icon|lucide_icon|inline_svg_tag)\(?\s*["']([a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?:\.svg)?["']/g)) add(m[1]);   // view helpers: icon("plus")
    for (const m of text.matchAll(/\bicons\.([a-z][a-zA-Z0-9]+)\b/g)) add(m[1].replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase());          // icon registries: icons.chevronDown
    return [...specs];
}

function printIcons(texts) {
    const specs = [...new Set(texts.flatMap(iconSpecs))].slice(0, 80);
    if (!specs.length) return;
    const found = [], missing = [];
    for (const spec of specs) {
        const set = (spec.match(/^i-([a-z0-9]+)-/) || spec.match(/^([a-z0-9-]+):/) || [])[1];
        let hit = null;
        try { hit = resolveIcon(spec, { fetch: !set || FETCHABLE_SETS.has(set) }); } catch { hit = null; }
        (hit ? found : missing).push(spec);
    }
    if (found.length) {
        console.log('==== icons these files name — write {{icon:<spec>}} where the screen shows one (or {{icon:<spec>|<classes>}} to size it); the injector inlines the SVG at 1em in the text colour, so never paste or look up SVG paths:');
        console.log(`  ${found.join('  ')}`);
    }
    if (missing.length) console.log(`  no SVG for: ${missing.join('  ')} — leave these out, or draw the source's own definition only where a depicted region needs it`);
    console.log('');
}

// ---- run context --------------------------------------------------------------

function articleDir(root) {
    const slug = (read(root, '.rtfm-trace/CURRENT') || '').trim();
    return slug ? path.join('output', 'articles', slug) : null;
}

function loadMap(root) {
    try { return JSON.parse(read(root, '.rtfm/project_map.json') || 'null'); } catch { return null; }
}

// ---- shell --------------------------------------------------------------------

function pickLayout(map, want) {
    const layouts = (map && map.layouts) || [];
    if (!layouts.length) return null;
    if (want) {
        const route = map.route_index && map.route_index[want];
        const name = route && route.layout ? String(route.layout) : want;
        const norm = x => String(x || '').toLowerCase();
        const hit = layouts.find(l => norm(l.path) === norm(want))
            || layouts.find(l => norm(l.name) === norm(name) || norm(l.area) === norm(name))
            || layouts.find(l => norm(l.path).includes(norm(name).split(' ')[0]));
        if (hit) return hit;
    }
    return layouts.find(l => (l.chrome || []).length) || layouts[0];
}

function compactJson(value, max) {
    const text = JSON.stringify(value);
    return text.length > max ? text.slice(0, max) + ' …(truncated)' : text;
}

function shellPack(root, opts) {
    const map = loadMap(root);
    if (!map) { console.log('shell pack: no .rtfm/project_map.json — read the layout yourself'); return; }
    let want = opts.views[0];
    const route = want && map.route_index && !Array.isArray(map.route_index) && map.route_index[want];
    const declared = route && /\.(?:erb|haml|slim)$/.test(route.primary_view || '') ? railsLayout(root, route.controller || route.controller_action) : null;
    if (declared) want = declared;
    const layout = pickLayout(map, want);
    console.log(`shell pack: the chrome every in-app mockup of this article shares — author it once, reuse it in each step\n`);
    if (map.app_shell) console.log(`==== app_shell (project_map.json)\n${compactJson(map.app_shell, 4000)}\n`);
    else console.log('==== app_shell: null — this app has no shared shell\n');
    if (map.color_scheme) console.log(`==== color_scheme (render the default scheme's tokens only)\n${compactJson(map.color_scheme, 1200)}\n`);
    if (!layout) { console.log('==== no layouts recorded in the map\n'); return; }
    const extra = {};
    for (const k of ['root_classes', 'runtime_chrome']) if (layout[k]) extra[k] = layout[k];
    console.log(`==== layout ${layout.path || layout.name}${layout.area ? ` (area: ${layout.area})` : ''}${Object.keys(extra).length ? `\n${compactJson(extra, 2500)}` : ''}\n`);
    const files = [layout.path, ...(layout.chrome || [])].filter(Boolean).filter((f, i, a) => a.indexOf(f) === i);
    const texts = printFiles(root, files.map(file => ({ file, depth: 0, via: null, kind: file === layout.path ? 'layout' : 'chrome' })), opts);
    printStrings(root, texts, opts);
    printIcons(texts.map(t => t.text));
    try {
        const manifest = JSON.parse(read(root, '.rtfm/images_base64.json') || '{}');
        const names = [...new Set(Object.keys(manifest.images || manifest).filter(k => /logo|brand|wordmark|favicon/i.test(k) && !k.startsWith('/')).map(k => k))].slice(0, 8);
        if (names.length) console.log(`==== logo candidates in the image manifest ({{img:<name>}}):\n  ${names.join('\n  ')}\n`);
    } catch { /* no manifest */ }
}

// ---- shared printing ------------------------------------------------------------

function printFiles(root, items, opts) {
    let budget = opts.maxBytes;
    const skipped = [];
    const texts = [];
    for (const item of items) {
        const text = read(root, item.file);
        if (text == null) {
            console.log(`==== ${item.file} — not found\n`);
            continue;
        }
        let body = markup(item.file, text);
        const truncated = body.length > PER_FILE_MAX;
        if (truncated) body = body.slice(0, PER_FILE_MAX);
        if (budget - body.length < 0 && item.kind !== 'view' && item.kind !== 'layout') {
            skipped.push(item);
            continue;
        }
        texts.push({ file: item.file, text });
        budget -= body.length;
        const how = item.depth === 0 ? item.kind : `depth ${item.depth}, ${item.kind}, via ${item.via}`;
        console.log(`==== ${item.file} (${how})${truncated ? ` — first ${PER_FILE_MAX} chars` : ''}`);
        console.log(body);
        console.log('');
    }
    if (skipped.length) {
        console.log(`==== not printed (budget ${opts.maxBytes} chars) — Read only the ones a step needs:`);
        for (const item of skipped) console.log(`  ${item.file} (depth ${item.depth}, ${item.kind})`);
        console.log('');
    }
    return texts;
}

function printStrings(root, texts, opts) {
    const keys = new Map();
    for (const { file, text } of texts) for (const key of keysIn(text)) if (!keys.has(key)) keys.set(key, file);
    if (!keys.size) return;
    const table = catalogue(root, opts.locale);
    const lines = [];
    let size = 0;
    for (const [key, file] of keys) {
        const value = lookup(table, key, file);
        const line = `  ${key} = ${value == null ? '(not found in the locale files)' : JSON.stringify(value)}`;
        if (size + line.length > 5000) { lines.push(`  … ${keys.size - lines.length} more keys`); break; }
        size += line.length;
        lines.push(line);
    }
    console.log(`==== UI strings referenced (${opts.locale} locale files; quote these values verbatim):`);
    console.log(lines.join('\n'));
    console.log('');
}

// The layout a Rails controller action renders with, read from the controller
// (an action's `render layout:`, else a class-level `layout "x"` honouring
// only/except, else the parent controller's), or null when it isn't declared
// literally. The map's route layout is model-written at detect time; this is the
// source's own answer.
function railsLayout(root, controllerAction) {
    const [controller, action] = String(controllerAction || '').split('#');
    if (!controller || !action) return null;
    const literal = /^["':]?([\w/]+)["']?$/;
    let file = path.join('app', 'controllers', `${controller}_controller.rb`);
    for (let hop = 0; hop < 3; hop++) {
        const text = read(root, file);
        if (text == null) return null;
        const body = text.match(new RegExp(`\\n\\s*def ${action}\\b([\\s\\S]*?)(?=\\n\\s*(?:def |private\\b|protected\\b)|$)`));
        const own = body && body[1].match(/\brender\b[^\n]*\blayout:\s*(["':][\w/]+["']?|false|nil)/);
        if (own) return /^(false|nil)$/.test(own[1]) ? null : own[1].replace(/["':]/g, '');
        for (const m of text.matchAll(/^\s*layout\s+(["':][\w/]+["']?)(.*)$/gm)) {
            if (!literal.test(m[1]) || m[1].startsWith(':')) continue;
            const scope = m[2] || '';
            const listed = list => (scope.match(new RegExp(`${list}:\\s*(\\[[^\\]]*\\]|:\\w+|%i\\[[^\\]]*\\])`)) || [])[1] || '';
            const only = listed('only'), except = listed('except');
            const has = l => new RegExp(`\\b${action}\\b`).test(l);
            if ((only && !has(only)) || (except && has(except))) continue;
            return m[1].replace(/["':]/g, '');
        }
        const parent = text.match(/class\s+[\w:]+\s*<\s*([\w:]+)Controller\b/);
        if (!parent || parent[1] === 'Application' || parent[1] === 'ActionController::Base') return null;
        file = path.join('app', 'controllers', `${parent[1].replace(/::/g, '/').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()}_controller.rb`);
    }
    return null;
}

// The view_sources.json fields of every route a printed view is the primary view
// of, ready to copy, so no step re-probes the map for them.
function printViewSources(root, views) {
    const map = loadMap(root);
    const index = map && map.route_index;
    if (!index) return;
    const entries = Array.isArray(index) ? index.map((v, i) => [v.key || v.path || String(i), v]) : Object.entries(index);
    const norm = f => String(f || '').replace(/^\.\//, '');
    const lines = [];
    for (const view of views.map(norm)) {
        const hits = entries.filter(([, v]) => norm(v.primary_view) === view);
        if (!hits.length) continue;
        const [, v] = hits[0];
        const keys = hits.map(([k]) => k);
        const declared = /\.(?:erb|haml|slim)$/.test(view) ? railsLayout(root, v.controller || v.controller_action) : null;
        const layoutName = declared || v.layout || null;
        const fields = { primary_view: v.primary_view, layout: layoutName, partials_expanded: v.partials_expanded || [] };
        if (declared && declared !== v.layout) lines.push(`  (the map records layout "${v.layout}", but ${v.controller || v.controller_action} renders with layout "${declared}" — use "${declared}" and its chrome: \`screen_pack.js --shell ${declared}\`)`);
        const later = (v.render_chain || []).filter(e => e.kind && e.kind !== 'unconditional').map(e => e.file);
        lines.push(`  route ${keys.slice(0, 8).join(', ')}${keys.length > 8 ? ` (+${keys.length - 8})` : ''}: ${compactJson(fields, 2500)}`);
        const layout = layoutName && pickLayout(map, String(layoutName));
        if (layout && (layout.chrome || []).length) lines.push(`    + layout chrome, in partials_expanded of every step that renders the shell: ${compactJson(layout.chrome, 1500)}`);
        if (later.length) lines.push(`    overlay/conditional — add to a step's partials_expanded only when that step shows it: ${compactJson(later, 1200)}`);
    }
    if (!lines.length) return;
    console.log('==== view_sources.json fields for these screens (copy into each step that depicts one):');
    console.log(lines.join('\n'));
    console.log('');
}

// ---- main ---------------------------------------------------------------------

function main() {
    const opts = args();
    const root = process.cwd();
    if (opts.shell) {
        if (!process.argv.includes('--max-bytes')) opts.maxBytes = 15000;
        return shellPack(root, opts);
    }
    if (!opts.views.length) {
        console.log('usage: screen_pack.js [--depth N] [--max-bytes N] [--locale CODE] <view_file>... | --shell [<layout>]');
        return;
    }
    const files = walk(root, opts.views, opts.depth);
    console.log(`screen pack: ${files.length} file(s) from ${opts.views.join(', ')} (depth ≤ ${opts.depth}); markup only, imports dropped\n`);
    const texts = printFiles(root, files, opts);
    printStrings(root, texts, opts);
    printIcons(texts.map(t => t.text));
    printViewSources(root, opts.views);
    const dir = articleDir(root);
    if (dir && !fs.existsSync(path.join(root, dir, 'article.json'))) {
        console.log(`NEXT: write ${dir}/article.json now — this flow's screens and labels are everything Phase 1 needs. The layout, shell, CSS bundle, icons and images are Phase 3 reading, after the article is on disk (run \`screen_pack.js --shell\` then).`);
    }
}

main();
