#!/usr/bin/env node
// Codex plugin launcher for the MCP server.
//
// Claude Code installs a plugin's npm dependencies; Codex copies the plugin and
// installs nothing. On the first start this installs the production
// dependencies from the shipped lockfile, without install scripts, then runs the
// server. stdout carries the MCP protocol, so npm's output goes to stderr.
// Chromium for screenshots downloads in the background, as the Claude plugin's
// SessionStart hook does, since Codex runs plugin hooks only once trusted.
import { spawn } from 'node:child_process';
import { open, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const lockFile = path.join(root, '.codex-install.lock');
const STALE_MS = 10 * 60 * 1000;
const installed = () => stat(path.join(root, 'node_modules/@modelcontextprotocol/sdk/package.json')).then(() => true, () => false);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function npmCi() {
  // npm sits beside node in standard installs; fall back to PATH.
  const local = path.join(path.dirname(process.execPath), 'npm');
  return stat(local).then(() => local, () => 'npm').then(npm => new Promise((resolve, reject) => {
    const child = spawn(npm, ['ci', '--omit=dev', '--ignore-scripts', '--no-bin-links', '--no-audit', '--no-fund', '--loglevel=error'],
      { cwd: root, env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: 'true' }, stdio: ['ignore', process.stderr, process.stderr] });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(Error(`npm ci exited with ${code}`)));
  }));
}

/** Install once, even when several Codex sessions start the server together. */
async function ensureDependencies() {
  while (!await installed()) {
    let handle;
    try { handle = await open(lockFile, 'wx'); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const age = await stat(lockFile).then(info => Date.now() - info.mtimeMs, () => 0);
      if (age > STALE_MS) await rm(lockFile, { force: true });
      else await sleep(1000);
      continue;
    }
    try {
      if (await installed()) return;
      process.stderr.write('WTFM: installing dependencies for the first start...\n');
      await npmCi();
    } finally {
      await handle.close();
      await rm(lockFile, { force: true });
    }
  }
}

try {
  await ensureDependencies();
} catch (error) {
  process.stderr.write(`WTFM could not install its dependencies: ${error.message}. Check that Node.js 22.12 or later and npm are on your PATH, then restart Codex.\n`);
  process.exit(1);
}
try {
  const { rendererReady } = await import('./lib/renderer.mjs');
  const { command } = await import('./lib/install.mjs');
  const { startDownload } = await import('./plugin-session.mjs');
  if (!await rendererReady(path.join(root, 'engine'), (cmd, args, options = {}) => command(cmd, args, { ...options, capture: true }))) await startDownload();
} catch { /* Screenshots report a missing renderer themselves; the server still starts. */ }
await import(pathToFileURL(path.join(root, 'dist/index.js')).href);
