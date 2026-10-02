import path from 'node:path';
import os from 'node:os';
import { chmod, copyFile, lstat, readFile, realpath, rename, rm } from 'node:fs/promises';
import { ARTICLE_SKILLS, installTraceHook } from './article-skills.mjs';
import { command, exists, privateJson } from './install.mjs';
import { ensureRenderer, rendererReady } from './renderer.mjs';
import { refreshCodexSkill } from './codex-skill.mjs';
import { refreshWriters } from './refresh-writers.mjs';

/** Did the previous release ever render? Releases with an engine count when
 * their Chromium is on disk; earlier releases installed renderer dependencies
 * into skills/<name>/node_modules. Unused installations download nothing. */
async function rendererUsed(previous, home, run) {
  if (await exists(path.join(previous, 'engine'))) {
    const node = path.resolve(previous, '../runtime/bin/node');
    if (await rendererReady(path.join(previous, 'engine'), run, await exists(node) ? node : process.execPath)) return true;
  }
  const roots = [path.join(previous, 'skills')];
  // A local CLI build may have used an older release's skills through the
  // managed ~/.rtfm-skills shortcut.
  try { roots.push(await realpath(path.join(home, '.rtfm-skills'))); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const root of roots) for (const skill of ARTICLE_SKILLS) if (await exists(path.join(root, skill, 'node_modules'))) return true;
  return false;
}

/** Point an existing SupportPages trace hook at this installation's Node hook,
 * through the managed `current` link so it survives later updates. Clients
 * that never had the hook are left alone. */
async function migrateTraceHook(root, { home, env }) {
  const settingsFile = path.join(env.CLAUDE_CONFIG_DIR || path.join(home, '.claude'), 'settings.json');
  let settings;
  try { settings = JSON.parse(await readFile(settingsFile, 'utf8')); } catch { return; }
  const managed = [path.join(home, '.rtfm-skills'), root];
  const hooks = (settings.hooks?.PostToolUse ?? []).flatMap(group => Array.isArray(group.hooks) ? group.hooks : []);
  if (!hooks.some(hook => /trace_hook\.(sh|js)/.test(String(hook.command ?? '')) && managed.some(prefix => String(hook.command).includes(prefix)))) return;
  const current = path.join(root, 'current');
  await installTraceHook({ home, env, writeJson: privateJson, hookCommand: [
    path.join(current, 'runtime', 'bin', 'node'),
    path.join(current, 'mcp', 'engine', 'generate-illustrated-article', 'scripts', 'trace_hook.js'),
  ] });
}

const MANAGED_LAUNCHER = '# SupportPages managed launcher';
async function managedLauncher(file) {
  try {
    if (!(await lstat(file)).isFile()) return false;
    return (await readFile(file, 'utf8')).split('\n')[1] === MANAGED_LAUNCHER;
  } catch { return false; }
}

/** Updates run the previous release's installer, which only writes the
 * `supportpages` launcher. Add the identical `wtfm` launcher beside it so an
 * existing installation gains the new command name. Best effort: anything
 * unexpected (no receipt, an unrelated wtfm) leaves the installation as it is. */
export async function ensureCommandAlias(root) {
  try {
    const receipt = JSON.parse(await readFile(path.join(root, 'install.json'), 'utf8'));
    if (typeof receipt.bin_dir !== 'string' || !path.isAbsolute(receipt.bin_dir)) return false;
    const existing = path.join(receipt.bin_dir, 'supportpages'), alias = path.join(receipt.bin_dir, 'wtfm');
    if (!await managedLauncher(existing)) return false;
    try { await lstat(alias); return false; } catch (error) { if (error.code !== 'ENOENT') return false; }
    const temporary = path.join(receipt.bin_dir, `.wtfm.${process.pid}.${Date.now()}`);
    try {
      await copyFile(existing, temporary);
      await chmod(temporary, 0o755);
      await rename(temporary, alias);
    } finally { await rm(temporary, { force: true }); }
    return true;
  } catch { return false; }
}

/** Prepare the new release's renderer and hook before promoting it, then
 * refresh managed writer and coordination instructions. */
export async function prepareUpdate(previous, next, { run = command, env = process.env, home = os.homedir() } = {}) {
  const engine = path.join(next, 'engine');
  if (await exists(engine) && await rendererUsed(previous, home, run)) {
    const node = path.resolve(next, '../runtime/bin/node');
    if (!await ensureRenderer(engine, run, { node })) throw Error('Could not prepare the updated article renderer. The current release is still active.');
  }
  if (await exists(engine)) await migrateTraceHook(path.resolve(next, '../../..'), { home, env });
  await refreshWriters({ home, env });
  await refreshCodexSkill({ home, env });
  await ensureCommandAlias(path.resolve(next, '../../..'));
}
