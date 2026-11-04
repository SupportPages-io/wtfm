#!/usr/bin/env node
'use strict';
// map_digest.js — prints the project map in one screen at STEP 0, so the topic is
// matched against the capability index without probing project_map.json piece
// by piece: app type, shell and colour scheme in one line, every index entry
// (key, path, primary view, layout, render-chain size) one per line, and the
// layouts with their chrome counts. Run from the repo root. Dependency-free;
// always exits 0.

const fs = require('fs');
const path = require('path');

const MAX_CHARS = 9000;

function main() {
    let map;
    try { map = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.rtfm', 'project_map.json'), 'utf8')); } catch {
        console.log('project map: none — discover the route the framework\'s usual way (budget ~10 searches)');
        return;
    }
    const shell = map.app_shell;
    const navCount = shell && Array.isArray(shell.nav_items) ? shell.nav_items.length : 0;
    const scheme = map.color_scheme && map.color_scheme.default;
    console.log(`project map: app_type=${map.app_type || 'web'} framework=${map.framework || '?'} app_shell=${shell ? `${shell.type || 'yes'} (${navCount} nav items)` : 'none'}${scheme ? ` color_scheme=${scheme}` : ''}`);

    const indexName = ['route_index', 'command_index', 'screen_index', 'dialog_index', 'view_index'].find(k => map[k] && Object.keys(map[k]).length);
    if (indexName) {
        const index = map[indexName];
        const entries = Array.isArray(index) ? index.map((v, i) => [v.route || v.path || String(i), v]) : Object.entries(index);
        console.log(`${indexName} (${entries.length} entries) — match the topic by meaning; key  path → primary view [layout] (render_chain files):`);
        let size = 0;
        let shown = 0;
        for (const [key, v] of entries) {
            const view = v.primary_view || v.definition_file || '';
            const where = v.path || v.route || v.command || '';
            const chain = Array.isArray(v.render_chain) ? ` (${v.render_chain.length})` : '';
            const layout = v.layout ? ` [${v.layout}]` : '';
            const note = v.note ? `  — ${String(v.note).slice(0, 80)}` : '';
            const line = `  ${key}  ${where} → ${view}${layout}${chain}${note}`;
            if (size + line.length > MAX_CHARS) break;
            size += line.length;
            shown += 1;
            console.log(line);
        }
        if (shown < entries.length) console.log(`  … ${entries.length - shown} more entries in .rtfm/project_map.json`);
    }
    const layouts = map.layouts || [];
    if (layouts.length) {
        console.log(`layouts (${layouts.length}):`);
        for (const l of layouts) {
            const area = l.area ? ` — ${String(l.area).slice(0, 90)}` : '';
            console.log(`  ${l.path || l.name}  chrome ${(l.chrome || []).length}${l.runtime_chrome ? ' + runtime_chrome' : ''}${area}`);
        }
    }
}

main();
