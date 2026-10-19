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
import { build, transform } from 'esbuild';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exists } from './lib/install.mjs';

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_FILES = ['dist', 'engine', 'scripts', 'LICENSE', 'NOTICE'];
// Release tooling runs only in CI. Shipped, it reads like the plugin handling
// release credentials.
const RELEASE_SCRIPTS = ['build-plugin.mjs', 'build-release.mjs', 'check-release.mjs', 'publish-release.mjs', 'smoke-release.mjs'];

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

/**
 * Remove whole-line comments, keeping @license blocks. The code is only
 * rewritten when esbuild reads both versions as the same program.
 */
async function withoutComments(code) {
  const kept = [];
  let block = null;
  for (const line of code.split('\n')) {
    const trimmed = line.trim();
    if (block) {
      block.push(line);
      if (trimmed.endsWith('*/')) {
        if (block.some(item => item.includes('@license'))) kept.push(...block);
        block = null;
      } else if (trimmed.includes('*/')) return code;
    } else if (trimmed.startsWith('/*') && !trimmed.startsWith('/*#')) {
      const close = trimmed.indexOf('*/', 2);
      if (close < 0) block = [line];
      else if (trimmed.includes('@license')) kept.push(line);
      else if (trimmed.slice(close + 2).trim()) kept.push(line.slice(0, line.indexOf('/*')) + trimmed.slice(close + 2).trimStart());
    } else if (!trimmed.startsWith('//')) kept.push(line);
  }
  if (block) return code;
  const stripped = kept.join('\n');
  const program = async text => (await transform(text, { loader: 'js', format: 'esm', target: 'esnext', minifyWhitespace: true, legalComments: 'none' })).code;
  try { return await program(stripped) === await program(code) ? stripped : code; }
  catch { return code; }
}

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
    const to = path.join(target, name);
    await cp(from, to, {
      recursive: true,
      filter: file => {
        const relative = path.relative(from, file).split(path.sep).join('/');
        return !/^(src|node_modules|lib\/es5-iife)(\/|$)/.test(relative) && !/\.(d\.ts|map|md)$/.test(relative);
      },
    });
    // Drop comments (keeping licence headers): their example and issue URLs
    // read to the plugin directory's review as hosts the code contacts.
    for (const file of await readdir(to, { recursive: true })) {
      if (!/\.m?js$/.test(file)) continue;
      const code = await readFile(path.join(to, file), 'utf8');
      const stripped = await withoutComments(code);
      if (stripped !== code) await writeFile(path.join(to, file), stripped);
    }
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
  // Nothing is installed from the tree either, so no lockfiles.
  for (const name of PACKAGE_FILES) {
    await cp(path.join(root, name), path.join(out, name), {
      recursive: true,
      filter: file => path.basename(file) !== 'package-lock.json'
        && !(path.dirname(file) === path.join(root, 'scripts') && RELEASE_SCRIPTS.includes(path.basename(file)))
        && (!/\.(d\.ts|map)$/.test(file) || !file.startsWith(path.join(root, 'dist'))),
    });
  }
  // The plugin's own README (no standalone installer), with the main README's
  // privacy section so the two cannot disagree.
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  const privacy = readme.match(/^## Privacy\n[\s\S]*?(?=^## )/m)?.[0].trim();
  if (!privacy) throw Error('README.md has no ## Privacy section.');
  await writeFile(path.join(out, 'README.md'), (await readFile(path.join(out, 'README.md'), 'utf8')).replace('<!-- privacy -->', privacy));
  // Manifests keep only what Node and the server read: the version, and the
  // module type (ESM for dist/; the engine's scripts stay CommonJS). Without a
  // dependency list they do not read as something to npm install.
  await writeFile(path.join(out, 'package.json'), JSON.stringify({ name: pkg.name, version: pkg.version, private: true, license: pkg.license, type: pkg.type }, null, 2) + '\n');
  for (const skill of await readdir(path.join(out, 'engine'), { withFileTypes: true })) {
    const manifest = path.join(out, 'engine', skill.name, 'package.json');
    if (!skill.isDirectory() || !await exists(manifest)) continue;
    const { name, version, type } = await readJson(manifest);
    await writeFile(manifest, JSON.stringify({ name, version, private: true, ...(type && { type }) }, null, 2) + '\n');
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
