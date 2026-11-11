#!/usr/bin/env node
'use strict';
// mockup_kit.js — answers the two lookups a mockup needs most, in one call each,
// so authoring is not a string of one-off greps. Run from the repo root.
//
//   node mockup_kit.js classes <class>...   which classes the CSS bundle defines
//   node mockup_kit.js icons <icon>...      inline <svg> for each icon name
//
// classes: each class is reported as `bundle` (a selector in .rtfm/branding.css —
// renders as is), `source` (absent from the bundle but used in the project's own
// files — the fidelity lint accepts it; mockup.css may compile it), or `missing`
// (an invented class: the lint fails it and nothing styles it).
//
// icons: accepts the spellings source code uses — "mdi:chef-hat", "mdiChefHat",
// "i-lucide-inbox", "lucide:inbox", "heroicons:user-plus", "tabler:plus" — and a
// bare name, looked up as a repo SVG. Resolution order: repo SVG files, installed
// icon packages (lucide-static, @mdi/svg, @mdi/js, heroicons, @tabler/icons,
// bootstrap-icons), Iconify JSON sets (@iconify-json/<set> or
// @iconify/json, installed or fetched once with `npm pack` into
// ~/.cache/rtfm-skills/icons). Prints each SVG on one line, ready to paste.
// Dependency-free; always exits 0.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = process.cwd();
const [mode, ...names] = process.argv.slice(2);

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function exists(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }

// ---- classes ------------------------------------------------------------------

function bundleClasses() {
    const css = read(path.join(root, '.rtfm', 'branding.css')) || '';
    const set = new Set();
    for (const m of css.matchAll(/\.((?:[\w-]|\\.)+)/g)) set.add(m[1].replace(/\\(.)/g, '$1'));
    return set;
}

function usedInSource(cls) {
    try {
        const out = execFileSync('git', ['grep', '-l', '-F', '--', cls], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 8 * 1024 * 1024 });
        return out.split('\n').filter(f => f && !/^(output|\.rtfm)/.test(f)).length;
    } catch { return 0; }
}

function classes(list) {
    const bundle = bundleClasses();
    if (!bundle.size) console.log('(no .rtfm/branding.css — every class reports as source/missing)');
    for (const cls of list) {
        const name = cls.replace(/^\./, '');
        if (bundle.has(name)) console.log(`bundle   ${name}`);
        else if (usedInSource(name)) console.log(`source   ${name}`);
        else console.log(`missing  ${name}`);
    }
}

// ---- icons --------------------------------------------------------------------

const kebab = s => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Za-z])([0-9])/g, '$1-$2').toLowerCase();

function parse(spec) {
    let m;
    if ((m = spec.match(/^i-([a-z0-9]+)-(.+)$/))) return { set: m[1], name: m[2] };          // unocss/iconify class
    if ((m = spec.match(/^([a-z0-9-]+):(.+)$/))) return { set: m[1], name: m[2] };           // iconify id
    if ((m = spec.match(/^(mdi|bi)-(.+)$/))) return { set: m[1], name: m[2] };               // vuetify / bootstrap-icons class
    if ((m = spec.match(/^mdi([A-Z].*)$/))) return { set: 'mdi', name: kebab(m[1]) };         // @mdi/js export
    if ((m = spec.match(/^Lucide([A-Z].*)$/))) return { set: 'lucide', name: kebab(m[1]) };     // lucide-react
    if ((m = spec.match(/^Icon([A-Z].*)$/))) return { set: 'tabler', name: kebab(m[1]) };       // @tabler/icons-react
    if ((m = spec.match(/^([A-Z].*?)Icon$/))) return { set: 'heroicons', name: kebab(m[1]) };   // @heroicons/react
    return { set: null, name: kebab(spec) };
}

function svgLine(svg) {
    return svg.replace(/<\?xml[^>]*>/, '').replace(/<!--[\s\S]*?-->/g, '').replace(/\s*\n\s*/g, ' ').trim();
}

let svgFiles = null;
function repoSvg(name, exact = true) {
    if (!svgFiles) {
        try {
            svgFiles = execFileSync('git', ['ls-files', '*.svg'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32 * 1024 * 1024 }).split('\n');
        } catch { svgFiles = []; }
    }
    const files = svgFiles;
    const hit = exact ? files.find(f => path.basename(f, '.svg').toLowerCase() === name)
        : files.find(f => path.basename(f, '.svg').toLowerCase().replace(/^(icon[-_]?|ic[-_])/, '') === name);
    return hit ? { svg: strokeable(svgLine(read(path.join(root, hit)) || '')), from: hit } : null;
}

// A stroke-drawn repo SVG with no stroke colour paints nothing outside the app's
// own CSS: give it the text colour, as icon components do.
function strokeable(svg) {
    if (/\bstroke-(?:width|linecap|linejoin)=/.test(svg) && !/\bstroke=/.test(svg)) return svg.replace(/^<svg\b/, '<svg stroke="currentColor"');
    return svg;
}

// Icon sets the project depends on (package.json files, Gemfile), so a bare name
// resolves against the app's own library before any loosely matching repo SVG.
const SET_DEPS = [
    [/^(?:lucide(?:-[a-z]+)?|@lucide\/.+|lucide-rails)$/, 'lucide'], [/^@tabler\/icons/, 'tabler'],
    [/^(?:@heroicons\/.+|heroicons?(?:-[a-z]+)?|heroicon)$/, 'heroicons'], [/^(?:@mdi\/.+|vuetify)$/, 'mdi'],
    [/^(?:bootstrap-icons|ngx-bootstrap-icons|@ng-icons\/bootstrap-icons)$/, 'bi'], [/^(?:@phosphor-icons\/.+|phosphor-react)$/, 'ph'],
    [/^remixicon/, 'ri'], [/^@iconify-json\/(.+)$/, null],
];
let projectSets = null;
function iconSetsOfProject() {
    if (projectSets) return projectSets;
    const sets = [];
    const add = dep => {
        for (const [re, set] of SET_DEPS) {
            const m = dep.match(re);
            if (m && !sets.includes(set || m[1])) sets.push(set || m[1]);
        }
    };
    let manifests = [];
    try {
        manifests = execFileSync('git', ['ls-files', 'package.json', '*/package.json', '*/*/package.json', 'Gemfile'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
            .split('\n').filter(f => f && !/node_modules|vendor\//.test(f));
    } catch { /* not a git checkout */ }
    for (const f of manifests) {
        const text = read(path.join(root, f)) || '';
        if (f.endsWith('Gemfile')) for (const m of text.matchAll(/^\s*gem\s+["']([\w-]+)["']/gm)) add(m[1]);
        else {
            try {
                const pkg = JSON.parse(text);
                for (const k of ['dependencies', 'devDependencies', 'peerDependencies']) Object.keys(pkg[k] || {}).forEach(add);
            } catch { /* invalid package.json */ }
        }
    }
    return (projectSets = sets);
}

// Iconify-format icons defined in the project's own source (custom collections
// handed to an icons plugin: `name: { body: '<path …/>', width, height }`).
let collectionFiles = null;
function repoCollectionIcon(name) {
    if (!collectionFiles) {
        try {
            collectionFiles = execFileSync('git', ['grep', '-l', '-E', 'body:[[:space:]]*[`\x27"]<', '--', '*.js', '*.ts', '*.mjs', '*.cjs', '*.json'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 8 * 1024 * 1024 })
                .split('\n').filter(f => f && !/node_modules|(^|\/)(dist|build|vendor)\//.test(f)).slice(0, 20);
        } catch { collectionFiles = []; }
    }
    const key = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[\\s,{])["'\x60]?${key}["'\x60]?\\s*:\\s*\\{\\s*["']?body["']?\\s*:\\s*([\x60'"])([\\s\\S]*?)\\1([^}]*)\\}`);
    for (const f of collectionFiles) {
        const m = (read(path.join(root, f)) || '').match(re);
        if (!m) continue;
        const dim = k => { const d = m[3].match(new RegExp(`${k}["']?\\s*:\\s*(\\d+(?:\\.\\d+)?)`)); return d ? d[1] : 16; };
        const w = dim('width'), h = dim('height');
        return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${m[2].replace(/\s*\n\s*/g, ' ')}</svg>`, from: f };
    }
    return null;
}

function nodeModulesDirs() {
    const dirs = [];
    let dir = root;
    for (let i = 0; i < 6; i++) {
        const nm = path.join(dir, 'node_modules');
        if (fs.existsSync(nm)) dirs.push(nm);
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    for (const sub of ['frontend', 'client', 'web', 'app', 'packages']) {
        const nm = path.join(root, sub, 'node_modules');
        if (fs.existsSync(nm)) dirs.push(nm);
    }
    return dirs;
}

function packageSvg(set, name) {
    const candidates = {
        lucide: ['lucide-static/icons/{n}.svg'],
        mdi: ['@mdi/svg/svg/{n}.svg'],
        heroicons: ['heroicons/24/outline/{n}.svg', 'heroicons/outline/{n}.svg'],
        tabler: ['@tabler/icons/icons/outline/{n}.svg', '@tabler/icons/icons/{n}.svg'],
        bi: ['bootstrap-icons/icons/{n}.svg'],
    };
    const sets = set ? [set] : Object.keys(candidates);
    for (const nm of nodeModulesDirs()) {
        for (const s of sets) {
            for (const pattern of candidates[s] || []) {
                const p = path.join(nm, pattern.replace('{n}', name));
                if (exists(p)) return { svg: svgLine(read(p)), from: path.relative(root, p) };
            }
        }
        if ((!set || set === 'mdi') && exists(path.join(nm, '@mdi/js/mdi.js'))) {
            const js = read(path.join(nm, '@mdi/js/mdi.js'));
            const exportName = 'mdi' + name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
            const m = js && js.match(new RegExp(`${exportName}\\s*=\\s*"([^"]+)"`));
            if (m) return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="${m[1]}"/></svg>`, from: '@mdi/js' };
        }
    }
    return null;
}

const iconifyCache = new Map();
function iconifySet(set, { fetch = true } = {}) {
    if (iconifyCache.has(set)) return iconifyCache.get(set);
    let json = null;
    const local = [];
    for (const nm of nodeModulesDirs()) {
        local.push(path.join(nm, '@iconify-json', set, 'icons.json'), path.join(nm, '@iconify', 'json', 'json', `${set}.json`));
    }
    const cacheDir = path.join(os.homedir(), '.cache', 'rtfm-skills', 'icons');
    const cached = path.join(cacheDir, `${set}.json`);
    for (const p of [...local, cached]) {
        if (exists(p)) { try { json = JSON.parse(read(p)); break; } catch { /* corrupt: try next */ } }
    }
    // A failed fetch (offline container, unknown set) is remembered for a day so
    // per-block renders don't each wait out the timeout again.
    const miss = path.join(cacheDir, `${set}.missing`);
    const recentMiss = () => { try { return Date.now() - fs.statSync(miss).mtimeMs < 86400000; } catch { return false; } };
    if (!json && fetch && /^[a-z0-9-]+$/.test(set) && !recentMiss()) {
        try {
            fs.mkdirSync(cacheDir, { recursive: true });
            const tgz = execFileSync('npm', ['pack', `@iconify-json/${set}`, '--silent', '--pack-destination', cacheDir],
                { cwd: cacheDir, encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n').pop();
            execFileSync('tar', ['-xzf', path.join(cacheDir, tgz), '-C', cacheDir, 'package/icons.json'], { timeout: 30000, stdio: 'ignore' });
            fs.renameSync(path.join(cacheDir, 'package', 'icons.json'), cached);
            fs.rmSync(path.join(cacheDir, tgz), { force: true });
            json = JSON.parse(read(cached));
        } catch {
            json = null;
            try { fs.writeFileSync(miss, ''); } catch { /* read-only home: retry next time */ }
        }
    }
    iconifyCache.set(set, json);
    return json;
}

function iconifySvg(set, name, opts) {
    const json = iconifySet(set, opts);
    if (!json || !json.icons) return null;
    const id = json.icons[name] ? name : (json.aliases && json.aliases[name] && json.aliases[name].parent);
    const icon = id && json.icons[id];
    if (!icon) return null;
    const w = icon.width || json.width || 16;   // Iconify JSON defaults to 16×16
    const h = icon.height || json.height || 16;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.left || 0} ${icon.top || 0} ${w} ${h}" width="${w}" height="${h}">${icon.body}</svg>`, from: `iconify ${set}` };
}

// { svg, from } for an icon spec, or null. `fetch: false` keeps to local sources.
function resolveIcon(spec, opts = {}) {
    const { set, name } = parse(spec);
    if (set) return packageSvg(set, name) || iconifySvg(set, name, opts) || repoCollectionIcon(name) || repoSvg(name);
    const own = iconSetsOfProject();
    return repoSvg(name)
        || own.map(s => packageSvg(s, name) || iconifySvg(s, name, opts)).find(Boolean)
        || repoSvg(name, false) || repoCollectionIcon(name) || packageSvg(null, name)
        || ['lucide', 'mdi', 'heroicons', 'tabler'].filter(s => !own.includes(s)).map(s => iconifySvg(s, name, opts)).find(Boolean)
        || null;
}

function icons(list) {
    for (const spec of list) {
        const hit = resolveIcon(spec);
        if (hit) {
            console.log(`${spec}  (${hit.from})`);
            console.log(`  ${hit.svg}`);
        } else {
            console.log(`${spec}  NOT FOUND — read the icon's source or draw a simple equivalent`);
        }
    }
}

module.exports = { resolveIcon, parse };

if (require.main === module) {
    if (mode === 'classes' && names.length) classes(names);
    else if (mode === 'icons' && names.length) icons(names);
    else console.log('usage: mockup_kit.js classes <class>... | icons <icon>...');
}
