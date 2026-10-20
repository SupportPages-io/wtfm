import test from 'node:test';
import assert from 'node:assert/strict';
import { lstat, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { buildPlugin } from '../scripts/build-plugin.mjs';
import { writerAgentFile } from '../dist/writer-agent.js';

const json = async file => JSON.parse(await readFile(file, 'utf8'));

async function walk(directory) {
  const found = { files: [], symlinks: [] };
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) found.symlinks.push(file);
    else if (entry.isDirectory()) {
      const inner = await walk(file);
      found.files.push(...inner.files);
      found.symlinks.push(...inner.symlinks);
    } else found.files.push(file);
  }
  return found;
}

async function builtPlugin(t, options = {}) {
  const out = await mkdtemp(path.join(os.tmpdir(), 'supportpages-plugin-'));
  t.after(() => rm(out, { recursive: true, force: true }));
  return { out, ...await buildPlugin({ out, ...options }) };
}

test('the plugin tree carries the built server, engine, generated writer agent and matching manifests', async t => {
  const { out, version } = await builtPlugin(t);
  const pkg = await json('package.json');
  const plugin = await json(path.join(out, '.claude-plugin/plugin.json'));
  assert.equal(version, pkg.version);
  assert.equal(plugin.version, pkg.version);
  assert.equal(plugin.license, pkg.license);

  // The marketplace on main installs this plugin by name from the claude-plugin branch.
  const marketplace = await json('.claude-plugin/marketplace.json');
  assert.deepEqual(marketplace.plugins.map(entry => entry.name), [plugin.name]);
  assert.equal(marketplace.plugins[0].source.ref, 'claude-plugin');

  // Plugin agents are namespaced <plugin>:<agent>; the server is told the plugin name.
  const server = (await json(path.join(out, '.mcp.json'))).mcpServers.supportpages;
  assert.deepEqual(server.args, ['${CLAUDE_PLUGIN_ROOT}/dist/index.js']);
  assert.equal(server.env.SUPPORTPAGES_PLUGIN, plugin.name);
  assert.equal(await readFile(path.join(out, 'agents/supportpages-io.md'), 'utf8'), writerAgentFile);

  // Every hook command names a file the tree ships.
  const hooks = (await json(path.join(out, 'hooks/hooks.json'))).hooks;
  const commands = Object.values(hooks).flat().flatMap(group => group.hooks.map(hook => hook.command));
  assert.ok(commands.length >= 2);
  for (const command of commands) {
    const [, relative] = command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"]+)"/) ?? [];
    assert.ok(relative, command);
    assert.ok((await lstat(path.join(out, relative))).isFile(), relative);
  }
  for (const name of ['dist/index.js', 'engine/generate-illustrated-article/SKILL.md', 'engine/detect-project/SKILL.md', 'LICENSE', 'NOTICE']) {
    assert.ok((await lstat(path.join(out, name))).isFile(), name);
  }
  // npm drops symlinks from packages, and the same engine ships through npm.
  assert.deepEqual((await walk(path.join(out, 'engine'))).symlinks, []);
});

test('the plugin tree stays inside the plugin directory limits', async t => {
  const { out } = await builtPlugin(t);
  const { files, symlinks } = await walk(out);
  // Exceeding any of these holds every release for manual review.
  assert.ok(files.length <= 512, `${files.length} files; the limit is 512`);
  const large = [];
  for (const file of files) if ((await lstat(file)).size > 256 * 1024) large.push(path.relative(out, file));
  assert.deepEqual(large, [], 'files over 256 KiB');
  assert.deepEqual(symlinks.map(file => path.relative(out, file)), []);
  assert.deepEqual(files.filter(file => /\.(d\.ts|map)$/.test(file) || path.basename(file) === '.DS_Store').map(file => path.relative(out, file)), []);

  // Claude Code installs the dependencies; bundling them made the directory's scan time out.
  assert.deepEqual(files.filter(file => path.relative(out, file).split(path.sep).includes('node_modules')), []);
  assert.deepEqual(files.filter(file => path.basename(file) === 'package-lock.json').map(file => path.relative(out, file)), ['package-lock.json']);
  for (const file of files.filter(file => path.basename(file) === 'package.json' && path.dirname(file) !== out)) {
    assert.deepEqual(Object.keys(await json(file)).filter(key => /dependencies|scripts|bin/i.test(key)), [], path.relative(out, file));
  }
  const pkg = await json('package.json');
  const manifest = await json(path.join(out, 'package.json'));
  assert.equal(manifest.type, 'module');
  assert.deepEqual(manifest.dependencies, pkg.dependencies);
  assert.equal(manifest.scripts, undefined);

  // The directory's review reads release tooling, an installer pipe beside the
  // token reader, and URLs in comments as credentials leaving the machine.
  assert.deepEqual(files.filter(file => /(build|check|publish|smoke)-release|build-plugin/.test(path.basename(file))).map(file => path.relative(out, file)), []);
  const readme = await readFile(path.join(out, 'README.md'), 'utf8');
  assert.doesNotMatch(readme, /curl|<!-- privacy -->/);
  assert.match(readme, /^## Privacy$/m);
  assert.match(readme, /^\/plugin install wtfm --marketplace SupportPages-io\/wtfm$/m);

  // framework7's embedded font is wrapped: the review holds words it cannot check.
  const framework7 = await readFile(path.join(out, 'engine/detect-project/assets/mobileui/framework7-core.css'), 'utf8');
  assert.doesNotMatch(framework7, /font-woff;charset|base64, /);
  assert.match(framework7, /url\('data:font\/woff;base64,\\\nd09GRg/);
  assert.ok(framework7.split('\n').every(line => line.length <= 2000), 'a line over 2,000 characters');

  // The listing icon: a square PNG of 512-2048 px, under 2 MB.
  const icon = await readFile(path.join(out, '.claude-plugin/icon.png'));
  assert.equal(icon.subarray(1, 4).toString(), 'PNG');
  const [width, height] = [icon.readUInt32BE(16), icon.readUInt32BE(20)];
  assert.ok(width === height && width >= 512 && width <= 2048, `${width}x${height}`);
  assert.ok(icon.length < 2 * 1024 * 1024);
});

test('the lockfile installs exactly the production dependencies, as Claude Code requires', async t => {
  const { out } = await builtPlugin(t);
  const manifest = await json(path.join(out, 'package.json'));
  const lock = await json(path.join(out, 'package-lock.json'));
  // Claude Code skips the install when the two list different dependencies.
  const { name, version, license, ...listed } = lock.packages[''];
  assert.deepEqual(listed, { dependencies: manifest.dependencies, engines: manifest.engines });
  assert.deepEqual(Object.entries(lock.packages).filter(([, entry]) => entry.dev || entry.link || entry.inBundle).map(([key]) => key), []);
  for (const [key, entry] of Object.entries(lock.packages)) {
    if (key) assert.ok(entry.version && entry.resolved?.startsWith('https://registry.npmjs.org/') && entry.integrity, key);
  }
});

test('every dependency loads once installed the way Claude Code installs it', async t => {
  const { out } = await builtPlugin(t);
  const install = spawnSync('npm', ['ci', '--ignore-scripts', '--workspaces=false', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: out, encoding: 'utf8' });
  assert.equal(install.status, 0, install.stderr);
  const specifiers = ['zod', '@modelcontextprotocol/sdk/server/mcp.js', '@modelcontextprotocol/sdk/server/stdio.js', 'marked', '@clack/prompts',
    '@puppeteer/browsers', 'yauzl', 'puppeteer', 'puppeteer/internal/node/install.js'];
  const probe = `for (const s of ${JSON.stringify(specifiers)}) await import(s);
    if (typeof (await import('puppeteer')).default.launch !== 'function') throw Error('puppeteer.launch');`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', probe], { cwd: out, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  // The engine's renderer resolves puppeteer from its own location, as CommonJS.
  const renderer = spawnSync(process.execPath, ['-e', "if (!require('puppeteer').launch) process.exit(1)"], { cwd: path.join(out, 'engine/generate-illustrated-article'), encoding: 'utf8' });
  assert.equal(renderer.status, 0, renderer.stderr);
});

test('plugin sessions launch the namespaced writer agent', () => {
  const probe = "import('./dist/writer-agent.js').then(m => console.log(JSON.stringify([m.writerSubagentType, m.writerLaunchInstruction.includes('subagent_type=\"' + m.writerSubagentType + '\"')])))";
  const plain = spawnSync(process.execPath, ['-e', probe], { encoding: 'utf8', env: { ...process.env, SUPPORTPAGES_PLUGIN: '' } });
  assert.deepEqual(JSON.parse(plain.stdout), ['supportpages-io', true]);
  const plugin = spawnSync(process.execPath, ['-e', probe], { encoding: 'utf8', env: { ...process.env, SUPPORTPAGES_PLUGIN: 'wtfm' } });
  assert.deepEqual(JSON.parse(plugin.stdout), ['wtfm:supportpages-io', true]);
});

test('the mcp command starts the stdio server through the package command', async () => {
  const result = spawnSync(process.execPath, ['scripts/cli.mjs', 'mcp', '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: supportpages-mcp/);
});
