#!/usr/bin/env node
'use strict';

// Tests for check_css_health.js check 4 (theme-switch tokens) and the gate's
// exit status around it. Checks 1–3 are exercised end to end by the detect runs.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { findThemeSwitchTokens, analyzeColorScheme } = require('./check_css_health.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'css-health-'));
const write = (name, value) => {
    const file = path.join(tmp, name);
    fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
    return file;
};
const run = (cssFile, mapFile) => spawnSync(process.execPath,
    [path.join(__dirname, 'check_css_health.js'), cssFile, '--project-map', mapFile, '--project-dir', tmp],
    { encoding: 'utf8' });

// A themed bundle: hundreds of rules scoped under a dark class (Blueprint-style).
let themed = ':root{--bg:#fff}\nbody{color:#111}\n';
for (let i = 0; i < 40; i++) themed += `.bp4-dark .bp4-menu-item-${i}{color:#fff}\nhtml.bp4-dark .card-${i}{background:#30404d}\n`;
// Utilities that merely contain the words never qualify (subject of their own rule,
// or an ancestor of a handful of rules at most).
for (let i = 0; i < 12; i++) themed += `.navbar-dark .nav-link-${i}{color:#fff}\n.bg-dark{background:#000}\n.text-light{color:#eee}\n.btn-light:hover{color:#000}\n`;

// findThemeSwitchTokens: the theme class, counted by ancestor rules; utilities excluded.
{
    const found = findThemeSwitchTokens(themed);
    assert.deepStrictEqual([...found.keys()], ['bp4-dark']);
    assert.strictEqual(found.get('bp4-dark'), 80);
    // Tailwind v3 (`.dark .dark\:x`) and v4 (`:is(.dark *)`) shapes both count the switch, not the utility.
    let tw = '';
    for (let i = 0; i < 25; i++) tw += `.dark .dark\\:bg-${i}{background:#000}\n.dark\\:text-${i}:is(.dark *){color:#fff}\n`;
    assert.deepStrictEqual([...findThemeSwitchTokens(tw).keys()], ['dark']);
    assert.strictEqual(findThemeSwitchTokens('.bg-dark{background:#000}\n.dark{color:#fff}').size, 0);
}

// analyzeColorScheme: a theme token recorded as root state is an error naming the move.
{
    const leaked = { app_shell: { root_classes: { html: ['bp4-dark'], body: ['bp4-dark'] } } };
    const r = analyzeColorScheme(themed, leaked);
    assert.strictEqual(r.errors.length, 3, r.errors.join('\n'));   // html leak, body leak, no color_scheme
    assert.match(r.errors[0], /app_shell\.root_classes\.html records bp4-dark/);
    assert.match(r.errors[0], /theme switch, not root state/);
    assert.match(r.errors[2], /no color_scheme/);
    assert.match(r.errors[2], /"dark": \{"html": \["bp4-dark"\]/);
    assert.deepStrictEqual(r.theme_tokens, { 'bp4-dark': 80 });
}

// A map that records the scheme passes; an unlisted token only warns; a bad default fails.
{
    const scheme = { default: 'light', switchable: true, light: { html: [], body: [] },
        dark: { html: ['bp4-dark'], body: ['bp4-dark'] }, source: 'public/preload-theme.js' };
    const ok = analyzeColorScheme(themed, { app_shell: { root_classes: { html: [], body: [] } }, color_scheme: scheme });
    assert.deepStrictEqual(ok.errors, []);
    assert.deepStrictEqual(ok.warnings, []);
    assert.strictEqual(ok.recorded, 'light');

    const partial = analyzeColorScheme(themed, { color_scheme: { ...scheme, dark: { html: ['theme-dark'], body: [] } } });
    assert.deepStrictEqual(partial.errors, []);
    assert.match(partial.warnings[0], /lists in neither "light" nor "dark"/);

    const bad = analyzeColorScheme(themed, { color_scheme: { ...scheme, default: 'auto' } });
    assert.match(bad.errors[0], /color_scheme\.default must be "light" or "dark"/);

    // No theme in the CSS and no scheme recorded: nothing to say.
    const plain = analyzeColorScheme('body{color:#111}\n.bg-dark{background:#000}', { app_shell: { root_classes: { html: [], body: [] } } });
    assert.deepStrictEqual(plain, { errors: [], warnings: [], theme_tokens: {}, recorded: null });
}

// End to end: the gate fails on the leak and passes once the scheme is recorded.
{
    const css = write('branding.css', themed);
    const shell = { type: 'left-sidebar', nav_items: [{ label: 'Home' }, { label: 'Sales' }], root_classes: { html: ['bp4-dark'], body: ['bp4-dark'] } };
    const leaked = write('map-leaked.json', { schema_version: 5, app_type: 'web', app_shell: shell, layouts: [], route_index: {} });
    let proc = run(css, leaked);
    assert.strictEqual(proc.status, 1, proc.stdout);
    assert.match(proc.stdout, /\[FAIL\] ERROR: app_shell\.root_classes\.html records bp4-dark/);
    assert.match(proc.stdout, /theme-switch tokens: also a project_map\.json repair/);

    const fixed = write('map-fixed.json', { schema_version: 5, app_type: 'web',
        app_shell: { ...shell, root_classes: { html: [], body: [] } }, layouts: [], route_index: {},
        color_scheme: { default: 'light', switchable: true, light: { html: [], body: [] }, dark: { html: ['bp4-dark'], body: ['bp4-dark'] } } });
    proc = run(css, fixed);
    assert.strictEqual(proc.status, 0, proc.stdout);
    assert.match(proc.stdout, /\[ OK \] theme token\(s\) \.bp4-dark recorded in project_map\.color_scheme \(default: light\)/);
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log('check_css_health tests passed');
