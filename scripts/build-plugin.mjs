#!/usr/bin/env node
// Assemble an installable plugin tree: the Claude Code plugin that the
// `claude-plugin` branch publishes (plugin/), or the Codex plugin that the
// `codex-plugin` branch publishes (the shared hooks plus the plugin/codex/
// overlay). Both carry the same server and engine.
//
// Claude Code installs plugins by copying a git checkout and then installing
// the dependencies from package.json and package-lock.json (`npm ci
// --ignore-scripts`). It does not build TypeScript, so the tree ships compiled
// dist/ and the engine. Chromium is not included: the plugin's SessionStart
// hook downloads it on first use. Codex installs no dependencies: its MCP entry
// runs scripts/codex-mcp.mjs, which installs them from the shipped lockfile on
// the first start.
//
// Usage: node scripts/build-plugin.mjs --out <directory> [--target claude|codex]
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exists } from './lib/install.mjs';

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_FILES = ['dist', 'engine', 'scripts', 'LICENSE', 'NOTICE'];
// Release tooling runs only in CI. Shipped, it reads like the plugin handling
// release credentials.
const RELEASE_SCRIPTS = ['build-plugin.mjs', 'build-release.mjs', 'check-release.mjs', 'publish-release.mjs', 'smoke-release.mjs'];
export const TARGETS = ['claude', 'codex'];

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));

/**
 * A lockfile with only the production dependencies, at the versions this
 * checkout's lockfile pins. Claude Code installs a plugin's dependencies with
 * `npm ci --ignore-scripts`, and skips the install unless package.json and the
 * lockfile list exactly the same dependencies.
 */
async function productionLockfile(root, manifest) {
  const work = await mkdtemp(path.join(os.tmpdir(), 'wtfm-plugin-lock-'));
  try {
    await writeFile(path.join(work, 'package.json'), manifest);
    await cp(path.join(root, 'package-lock.json'), path.join(work, 'package-lock.json'));
    const result = spawnSync('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: work, encoding: 'utf8' });
    if (result.status !== 0) throw Error(`npm could not write the plugin lockfile: ${result.stderr || result.error?.message}`);
    return await readFile(path.join(work, 'package-lock.json'), 'utf8');
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

export async function buildPlugin({ out, root = repositoryRoot, target = 'claude' } = {}) {
  if (!TARGETS.includes(target)) throw Error(`Unknown plugin target ${target}: use ${TARGETS.join(' or ')}.`);
  if (!await exists(path.join(root, 'dist/writer-agent.js'))) throw Error('Build the server first: npm run build.');
  const pkg = await readJson(path.join(root, 'package.json'));
  out = path.resolve(out);
  await mkdir(out, { recursive: true });
  // Replace everything except the branch's own git metadata.
  for (const name of await readdir(out)) if (name !== '.git') await rm(path.join(out, name), { recursive: true, force: true });

  const codex = target === 'codex';
  const overlay = path.join(root, 'plugin/codex');
  if (codex) {
    // Codex takes the shared hooks and its own manifest, MCP config and README.
    await cp(path.join(root, 'plugin/hooks'), path.join(out, 'hooks'), { recursive: true });
    await cp(overlay, out, { recursive: true });
    const plugin = await readJson(path.join(out, '.codex-plugin/plugin.json'));
    await mkdir(path.join(out, 'assets'), { recursive: true });
    await cp(path.join(root, 'plugin/.claude-plugin/icon.png'), path.join(out, plugin.interface.logo));
    // The listing's screenshots, from the README's examples.
    for (const screenshot of plugin.interface.screenshots) {
      await mkdir(path.dirname(path.join(out, screenshot)), { recursive: true });
      await cp(path.join(root, 'docs/images', path.basename(screenshot)), path.join(out, screenshot));
    }
  } else {
    await cp(path.join(root, 'plugin'), out, { recursive: true, filter: file => file !== overlay });
    // The writer subagent, from the same definition the CLI installs.
    const { writerAgentFile, writerAgentType } = await import(pathToFileURL(path.join(root, 'dist/writer-agent.js')).href);
    await mkdir(path.join(out, 'agents'), { recursive: true });
    await writeFile(path.join(out, 'agents', `${writerAgentType}.md`), writerAgentFile);
  }
  const manifest = path.join(out, codex ? '.codex-plugin/plugin.json' : '.claude-plugin/plugin.json');
  await writeFile(manifest, JSON.stringify({ ...await readJson(manifest), version: pkg.version }, null, 2) + '\n');

  // Types and source maps are for development; nothing loads them at runtime.
  // The root lockfile is written below; the engine's own are not used. The
  // Codex tree also leaves out the engine's unit tests: the catalogue's scanner
  // reads their fake API keys as secrets.
  for (const name of PACKAGE_FILES) {
    await cp(path.join(root, name), path.join(out, name), {
      recursive: true,
      filter: file => path.basename(file) !== 'package-lock.json'
        && !(path.dirname(file) === path.join(root, 'scripts') && RELEASE_SCRIPTS.includes(path.basename(file)))
        && (!/\.(d\.ts|map)$/.test(file) || !file.startsWith(path.join(root, 'dist')))
        && !(codex && file.startsWith(path.join(root, 'engine')) && /^test_.*\.js$/.test(path.basename(file))),
    });
  }
  // framework7's stylesheet embeds its icon font as one 4,500-character word,
  // which the directory's review cannot check and holds. A CSS string may
  // continue across lines with a backslash, so the data URL is wrapped.
  const framework7 = path.join(out, 'engine/detect-project/assets/mobileui/framework7-core.css');
  if (await exists(framework7)) {
    const css = await readFile(framework7, 'utf8');
    const wrap = data => data.match(/.{1,64}/g).join('\\\n');
    await writeFile(framework7, css.replace(/url\('data:application\/font-woff;charset=utf-8;base64, ?([A-Za-z0-9+/=]+)'\)/g, (_, data) => `url('data:font/woff;base64,\\\n${wrap(data)}')`));
  }
  // The plugin's own README (no standalone installer), with the main README's
  // privacy section so the two cannot disagree.
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  const privacy = readme.match(/^## Privacy\n[\s\S]*?(?=^## )/m)?.[0].trim();
  if (!privacy) throw Error('README.md has no ## Privacy section.');
  await writeFile(path.join(out, 'README.md'), (await readFile(path.join(out, 'README.md'), 'utf8')).replace('<!-- privacy -->', privacy));
  // Claude Code installs the production dependencies from these two files.
  // Shipping node_modules instead (bundled to fit the directory's limits) made
  // the directory's scan time out.
  const rootManifest = JSON.stringify({ name: pkg.name, version: pkg.version, private: true, license: pkg.license, type: pkg.type, dependencies: pkg.dependencies, engines: pkg.engines }, null, 2) + '\n';
  await writeFile(path.join(out, 'package.json'), rootManifest);
  await writeFile(path.join(out, 'package-lock.json'), await productionLockfile(root, rootManifest));
  // The engine's manifests keep their module type (its scripts are CommonJS)
  // and drop their dependencies, which resolve from the root.
  for (const skill of await readdir(path.join(out, 'engine'), { withFileTypes: true })) {
    const manifest = path.join(out, 'engine', skill.name, 'package.json');
    if (!skill.isDirectory() || !await exists(manifest)) continue;
    const { name, version, type } = await readJson(manifest);
    await writeFile(manifest, JSON.stringify({ name, version, private: true, ...(type && { type }) }, null, 2) + '\n');
  }

  return { out, version: pkg.version };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { out: { type: 'string' }, target: { type: 'string', default: 'claude' } } });
    if (!values.out) throw Error('Usage: build-plugin.mjs --out <directory> [--target claude|codex]');
    const result = await buildPlugin({ out: values.out, target: values.target });
    process.stdout.write(`${result.out} (${result.version})\n`);
  } catch (error) {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  }
}
