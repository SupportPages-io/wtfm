#!/usr/bin/env node
// Assemble the installable plugin tree that the `plugin` branch publishes.
//
// Claude Code and Codex install plugins by copying a git checkout. Neither
// builds TypeScript, and Codex installs no npm dependencies, so the tree ships
// compiled dist/ and its production dependencies. Chromium is not included: the
// plugin's SessionStart hook downloads it on first use.
//
// The plugin directory holds each version to at most 512 files, none over
// 256 KiB, and no symlinks, so node_modules is rebuilt from this checkout's
// installed packages: small dependencies become a few esbuild bundles each, and
// puppeteer/puppeteer-core (too large for one file) ship their own JavaScript
// without types, maps or sources. Every package keeps its name, so the server's
// and the engine's imports resolve unchanged.
//
// Usage: node scripts/build-plugin.mjs --out <directory> [--skip-modules]
//   --skip-modules  leave out node_modules (faster tests of the rest of the tree)
import { build } from 'esbuild';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exists } from './lib/install.mjs';

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_FILES = ['dist', 'engine', 'scripts', 'package.json', 'package-lock.json', 'LICENSE', 'NOTICE', 'README.md'];

// Bundled ESM packages: entry name -> import specifier. Their own imports of
// other packages here stay external, so each package exists once.
const ESM_BUNDLES = {
  zod: { index: 'zod', v3: 'zod/v3', v4: 'zod/v4', 'v4-mini': 'zod/v4-mini', 'v4/core': 'zod/v4/core' },
  '@modelcontextprotocol/sdk': { 'server/mcp.js': '@modelcontextprotocol/sdk/server/mcp.js', 'server/stdio.js': '@modelcontextprotocol/sdk/server/stdio.js' },
  marked: { index: 'marked' },
  '@clack/prompts': { index: '@clack/prompts' },
  '@puppeteer/browsers': { index: '@puppeteer/browsers' },
  'chromium-bidi': { index: 'chromium-bidi' },
};
// CommonJS packages imported by the copied ones.
const CJS_BUNDLES = ['ws', 'lilconfig'];
// Shipped as their own files.
const COPIED = ['puppeteer', 'puppeteer-core'];

// Bundled CommonJS dependencies call require() for Node built-ins.
const requireBanner = { js: "import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);" };
// zod's `z.locales` re-exports every language (~200 KB); its default is English.
const englishOnly = {
  name: 'zod-english-only',
  setup(builder) {
    builder.onLoad({ filter: /zod[\\/]v4[\\/]locales[\\/]index\.js$/ }, () => ({ contents: "export { default as en } from './en.js';", loader: 'js' }));
  },
};

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const packageOf = input => input.match(/node_modules\/((?:@[^/]+\/)?[^/]+)\/(?!.*node_modules\/)/)?.[1];

/** Rebuild root's production dependencies into out/node_modules; returns the bundled packages' directories. */
async function buildModules(root, out) {
  const source = path.join(root, 'node_modules');
  const target = path.join(out, 'node_modules');
  const bundled = new Map();
  const options = { bundle: true, platform: 'node', target: 'node22', minify: true, legalComments: 'none', absWorkingDir: root, logLevel: 'warning', metafile: true };
  const record = metafile => {
    for (const input of Object.keys(metafile.inputs)) {
      const dir = input.slice(0, input.lastIndexOf('node_modules/')) + 'node_modules/' + packageOf(input);
      if (packageOf(input)) bundled.set(dir, packageOf(input));
    }
  };
  const manifest = async (name, fields) => {
    const { version, license } = await readJson(path.join(source, name, 'package.json'));
    await writeFile(path.join(target, name, 'package.json'), JSON.stringify({ name, version, license, ...fields }, null, 2) + '\n');
  };
  // Imports of another package built here stay external, but only when they
  // resolve to its top-level copy: a nested copy of a different version is bundled.
  const own = Object.keys(ESM_BUNDLES).concat(CJS_BUNDLES, COPIED);
  const external = self => ({
    name: 'top-level-packages',
    setup(builder) {
      builder.onResolve({ filter: /^[^./]/ }, async args => {
        const name = own.find(item => args.path === item || args.path.startsWith(item + '/'));
        if (!name || name === self || args.pluginData === 'resolving') return undefined;
        const resolved = await builder.resolve(args.path, { kind: args.kind, resolveDir: args.resolveDir, importer: args.importer, pluginData: 'resolving' });
        return resolved.path.startsWith(path.join(source, name) + path.sep) ? { path: args.path, external: true } : undefined;
      });
    },
  });

  for (const [name, entries] of Object.entries(ESM_BUNDLES)) {
    const entryPoints = Object.fromEntries(Object.entries(entries).map(([key, specifier]) => [key.replace(/\.js$/, ''), specifier]));
    const result = await build({ ...options, format: 'esm', splitting: true, banner: requireBanner, entryPoints, outdir: path.join(target, name), chunkNames: 'chunks/[hash]', plugins: [englishOnly, external(name)] });
    record(result.metafile);
    const exportsMap = Object.fromEntries(Object.keys(entries).map(key => [key === 'index' ? '.' : './' + key, './' + key.replace(/\.js$/, '') + '.js']));
    await manifest(name, { type: 'module', exports: exportsMap });
  }
  for (const name of CJS_BUNDLES) {
    const result = await build({ ...options, format: 'cjs', entryPoints: [path.join(source, name)], outfile: path.join(target, name, 'index.js'), plugins: [external(name)] });
    record(result.metafile);
    await manifest(name, { main: './index.js' });
  }
  for (const name of COPIED) {
    const from = path.join(source, name);
    await cp(from, path.join(target, name), {
      recursive: true,
      filter: file => {
        const relative = path.relative(from, file).split(path.sep).join('/');
        return !/^(src|node_modules|lib\/es5-iife)(\/|$)/.test(relative) && !/\.(d\.ts|map|md)$/.test(relative);
      },
    });
  }
  return bundled;
}

/** One file with the licence of every package inside a bundle (minifying drops their comments). */
async function writeLicenses(root, out, bundled) {
  const sections = [];
  for (const [dir, name] of [...bundled].sort(([, a], [, b]) => a.localeCompare(b))) {
    const { version, license } = await readJson(path.join(root, dir, 'package.json'));
    const files = (await readdir(path.join(root, dir))).filter(file => /^(licen[sc]e|copying)/i.test(file));
    const text = files.length ? (await readFile(path.join(root, dir, files[0]), 'utf8')).trim() : `Licensed under ${license}.`;
    sections.push(`${name}@${version} (${license})\n\n${text}`);
  }
  const unique = [...new Set(sections)];
  await writeFile(path.join(out, 'THIRD_PARTY_LICENSES.txt'), 'Packages bundled into node_modules/ by scripts/build-plugin.mjs.\n\n' + unique.join('\n\n' + '-'.repeat(72) + '\n\n') + '\n');
}

export async function buildPlugin({ out, root = repositoryRoot, modules = true } = {}) {
  if (!await exists(path.join(root, 'dist/writer-agent.js'))) throw Error('Build the server first: npm run build.');
  const pkg = await readJson(path.join(root, 'package.json'));
  out = path.resolve(out);
  await mkdir(out, { recursive: true });
  // Replace everything except the branch's own git metadata.
  for (const name of await readdir(out)) if (name !== '.git') await rm(path.join(out, name), { recursive: true, force: true });

  await cp(path.join(root, 'plugin'), out, { recursive: true });
  const manifest = path.join(out, '.claude-plugin/plugin.json');
  const plugin = await readJson(manifest);
  await writeFile(manifest, JSON.stringify({ ...plugin, version: pkg.version }, null, 2) + '\n');

  // The writer subagent, from the same definition the CLI installs.
  const { writerAgentFile, writerAgentType } = await import(pathToFileURL(path.join(root, 'dist/writer-agent.js')).href);
  await mkdir(path.join(out, 'agents'), { recursive: true });
  await writeFile(path.join(out, 'agents', `${writerAgentType}.md`), writerAgentFile);

  // Types and source maps are for development; nothing loads them at runtime.
  for (const name of PACKAGE_FILES) {
    await cp(path.join(root, name), path.join(out, name), { recursive: true, filter: file => !/\.(d\.ts|map)$/.test(file) || !file.startsWith(path.join(root, 'dist')) });
  }

  if (modules) await writeLicenses(root, out, await buildModules(root, out));
  return { out, version: pkg.version };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { out: { type: 'string' }, 'skip-modules': { type: 'boolean' } } });
    if (!values.out) throw Error('Usage: build-plugin.mjs --out <directory> [--skip-modules]');
    const result = await buildPlugin({ out: values.out, modules: !values['skip-modules'] });
    process.stdout.write(`${result.out} (${result.version})\n`);
  } catch (error) {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  }
}
