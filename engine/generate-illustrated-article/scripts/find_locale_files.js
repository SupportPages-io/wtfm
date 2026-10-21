#!/usr/bin/env node
'use strict';
// Finds a product's translation files for one locale, so an article written
// in that language quotes the product's own translated labels instead of
// translating them. Deterministic, Node built-ins only.
//
//   node find_locale_files.js <repo_dir> <locale>
//
// Prints {locale, default_locale_guess, has_locale, formats, target_files,
// default_files}: repo-relative, sorted, capped at MAX_FILES each.
// `default_files` is the same layout for English (or the platform's base:
// Android values/, Apple Base.lproj), where the default-language labels live.

const fs = require('fs');
const path = require('path');

const MAX_FILES = 200;
const MAX_WALK = 100000;
const MAX_DEPTH = 14;
const SKIP_DIRS = new Set([
    'node_modules', '.git', 'vendor', 'dist', 'build', 'tmp', 'coverage',
    '.rtfm', 'output', 'Pods', '.next', '.nuxt', '.svelte-kit', '.dart_tool', '.gradle', 'DerivedData',
]);
const LOCALE_DIRS = new Set(['locales', 'locale', 'i18n', 'lang', 'langs', 'messages', 'translations', 'l10n']);

function escapeRe(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// "fr" also matches region variants: fr-FR, fr_CA, values-fr-rCA.
function codePattern(code) { return `${escapeRe(code)}(?:[-_][A-Za-z0-9]{2,4})?`; }

function walk(root) {
    const files = [];
    const stack = [[root, 0]];
    while (stack.length && files.length < MAX_WALK) {
        const [dir, depth] = stack.pop();
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!SKIP_DIRS.has(entry.name) && depth < MAX_DEPTH) stack.push([full, depth + 1]);
            } else if (entry.isFile()) {
                files.push(path.relative(root, full).split(path.sep).join('/'));
            }
        }
    }
    return files;
}

function readHead(root, rel, bytes = 4096) {
    try {
        const fd = fs.openSync(path.join(root, rel), 'r');
        const buffer = Buffer.alloc(bytes);
        const read = fs.readSync(fd, buffer, 0, bytes, 0);
        fs.closeSync(fd);
        return buffer.slice(0, read).toString('utf8');
    } catch { return ''; }
}

// The first top-level YAML key, for Rails files named without the code
// (config/locales/devise.yml whose root is `fr:`).
function yamlRootKey(root, rel) {
    for (const line of readHead(root, rel).split(/\r?\n/)) {
        if (!line.trim() || /^\s*#/.test(line) || line.startsWith('---')) continue;
        const match = /^["']?([A-Za-z0-9_-]+)["']?\s*:/.exec(line);
        return match ? match[1] : null;
    }
    return null;
}

function xcstringsLocales(root, rel) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
        const locales = new Set();
        if (data.sourceLanguage) locales.add(String(data.sourceLanguage));
        for (const entry of Object.values(data.strings || {})) {
            for (const key of Object.keys((entry && entry.localizations) || {})) locales.add(key);
        }
        return { source: data.sourceLanguage || null, locales: [...locales] };
    } catch { return { source: null, locales: [] }; }
}

// The format a file has for `code`, or null when it is not that locale's file.
function classify(root, rel, code, { base = false } = {}) {
    const c = codePattern(code);
    const parts = rel.split('/');
    const name = parts[parts.length - 1];
    const parents = parts.slice(0, -1);
    const parent = parents[parents.length - 1] || '';
    const ext = path.extname(name).toLowerCase();
    const inLocaleDir = parents.some(dir => LOCALE_DIRS.has(dir.toLowerCase()));

    if (ext === '.yml' || ext === '.yaml') {
        if (new RegExp(`^(?:.+\\.)?${c}\\.ya?ml$`, 'i').test(name) && (inLocaleDir || /(^|\/)config\/locales\//.test(rel))) return 'yaml';
        if (inLocaleDir || /(^|\/)config\/locales\//.test(rel)) {
            const key = yamlRootKey(root, rel);
            if (key && new RegExp(`^${c}$`, 'i').test(key)) return 'yaml';
        }
        return null;
    }
    if (ext === '.php') {
        return parents.some((dir, i) => dir.toLowerCase() === 'lang' && new RegExp(`^${c}$`, 'i').test(parents[i + 1] || '')) ? 'php' : null;
    }
    if (ext === '.json') {
        if (new RegExp(`^${c}\\.json$`, 'i').test(name) && inLocaleDir) return 'json';
        if (parents.some((dir, i) => LOCALE_DIRS.has(dir.toLowerCase()) && new RegExp(`^${c}$`, 'i').test(parents[i + 1] || ''))) return 'json';
        return null;
    }
    if (ext === '.po') {
        if (parent === 'LC_MESSAGES' && new RegExp(`^${c}$`, 'i').test(parents[parents.length - 2] || '')) return 'gettext';
        if (new RegExp(`^${c}\\.po$`, 'i').test(name)) return 'gettext';
        return null;
    }
    if (ext === '.arb') return new RegExp(`_${c}\\.arb$`, 'i').test(name) ? 'arb' : null;
    if (name === 'strings.xml') {
        if (new RegExp(`^values-${escapeRe(code)}(?:-r[A-Za-z]{2})?$`, 'i').test(parent)) return 'android';
        if (base && parent === 'values') return 'android';
        return null;
    }
    if (ext === '.strings' || ext === '.stringsdict') {
        if (new RegExp(`^${c}\\.lproj$`, 'i').test(parent)) return 'apple-strings';
        if (base && parent === 'Base.lproj') return 'apple-strings';
        return null;
    }
    if (ext === '.xcstrings') {
        const { source, locales } = xcstringsLocales(root, rel);
        const re = new RegExp(`^${c}$`, 'i');
        if (locales.some(locale => re.test(locale))) return 'xcstrings';
        if (base && source) return 'xcstrings';
        return null;
    }
    return null;
}

function findLocaleFiles(root, locale) {
    const code = String(locale || '').trim().toLowerCase().split(/[-_]/)[0];
    const files = walk(root);
    const target = [], defaults = [], formats = new Set();
    let xcSource = null;
    for (const rel of files) {
        const format = classify(root, rel, code);
        if (format) { target.push(rel); formats.add(format); }
        if (code !== 'en' || !format) {
            if (classify(root, rel, 'en', { base: true })) defaults.push(rel);
        }
        if (!xcSource && rel.endsWith('.xcstrings')) xcSource = xcstringsLocales(root, rel).source;
    }
    const sortCap = list => [...new Set(list)].sort().slice(0, MAX_FILES);
    const englishFound = defaults.some(rel => classify(root, rel, 'en'));
    return {
        locale: code,
        default_locale_guess: englishFound ? 'en' : (xcSource || null),
        has_locale: target.length > 0,
        formats: [...formats].sort(),
        target_files: sortCap(target),
        default_files: sortCap(defaults),
    };
}

if (require.main === module) {
    const [repo, locale] = process.argv.slice(2);
    if (!repo || !locale) {
        console.error('usage: find_locale_files.js <repo_dir> <locale>');
        process.exit(2);
    }
    console.log(JSON.stringify(findLocaleFiles(path.resolve(repo), locale), null, 2));
}

module.exports = { findLocaleFiles, classify };
