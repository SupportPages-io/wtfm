import os from 'node:os';
import path from 'node:path';
import { lstat, readdir, realpath, rm } from 'node:fs/promises';
import { exists, expand } from './install.mjs';
import { managedInstallation } from './update.mjs';
import { managedLauncher } from './prepare-update.mjs';
import { removeIntegration } from './remove.mjs';
import { Cancelled } from './terminal.mjs';
import { fail } from '../../dist/errors.js';
import { defaultConfigDir } from '../../dist/session.js';
import { configureTelemetry } from '../../dist/telemetry.js';
import { apiOrigin, defaultOrigin, developmentMode } from '../../dist/api.js';
import { CLI_NAME } from './brand.mjs';

const MARKER = '.supportpages-install';
const LAUNCHERS = ['supportpages', 'wtfm'];
const clean = value => String(value).replace(/[\p{Cc}\p{Cf}]/gu, '');

/** Remove SupportPages Writer from this computer: the coding-agent integrations
 * (as `remove` does), then the managed installation and its launchers. Project
 * folders and their articles are never touched. The configuration directory
 * (sign-in, project bindings, the anonymous install id) is kept unless
 * --purge-config is given, so a reinstall picks up where this one left off.
 *
 * Runs from inside the tree it deletes. The builds are macOS and Linux only,
 * where unlinking a running program is fine; every module this needs is
 * imported above, so nothing is loaded after the files are gone. */
export async function uninstallCli(options, { installRoot, env = process.env, home = os.homedir(), ui, run, remove = removeIntegration, fetcher }) {
  if (env.SUPPORTPAGES_PLUGIN) {
    fail('plugin_installation', 'SupportPages Writer is installed as a coding-agent plugin here. Uninstall the plugin in your coding agent instead; there is no separate installation to remove.');
  }
  const { receipt, root } = await managedInstallation(installRoot, env,
    { reinstall: `Delete the installation directory yourself, after ${CLI_NAME} remove has disconnected your coding agents.` });
  const dataDir = await realpath(root);
  if (!await exists(path.join(dataDir, MARKER))) {
    fail('invalid_installation', `${clean(dataDir)} does not carry the SupportPages installation marker, so it will not be removed. Delete it yourself if it is ours.`);
  }
  const launchers = [];
  for (const name of LAUNCHERS) {
    const file = path.join(receipt.bin_dir, name);
    if (await managedLauncher(file, dataDir)) launchers.push(file);
    else if (await exists(file)) ui.line(`Keeping ${clean(file)}: not this installation's launcher.`);
  }
  const configDir = expand(options['config-dir'] ?? defaultConfigDir(), home);
  const purge = Boolean(options['purge-config']) && await exists(configDir);
  const keptConfig = !purge && await exists(configDir);

  ui.intro?.('SupportPages Writer · Uninstall');
  ui.line('Coding-agent integrations (Claude Code and Codex connections, writer agents, permission rules and skill shortcuts)');
  ui.line(`Installed releases and runtime: ${clean(dataDir)}`);
  for (const file of launchers) ui.line(`Command: ${clean(file)}`);
  if (purge) ui.line(`Configuration: ${clean(configDir)} (signs this computer out of SupportPages.io, forgets project bindings and resets the anonymous install id)`);
  ui.line(keptConfig
    ? `Kept: your project folders and articles, and ${clean(configDir)} (sign-in and project bindings; add --purge-config to remove it too).`
    : 'Kept: your project folders and articles.');
  if (!options.yes && !await ui.confirm(`Remove SupportPages Writer from this computer?`, false)) throw new Cancelled('Uninstall cancelled. Nothing was removed.');

  // One last anonymous count, so uninstalls show up beside installs. Only an
  // install that already reported (has an id, telemetry on) says goodbye; the
  // send is bounded by telemetry's own 3-second timeout and never fails this.
  await reportUninstall({ configDir, installRoot, env, fetcher, config: purge ? 'purged' : 'kept' });
  // Integrations first: `remove` needs the installation it is about to lose.
  const integrations = await remove({ command: 'remove', 'config-dir': options['config-dir'], yes: true }, { installRoot, env, home, ui, run });
  for (const file of launchers) await rm(file, { force: true });
  await rm(dataDir, { recursive: true, force: true });
  // The data directory sits in a shared parent (…/supportpages/cli); drop the parent only when it is now empty.
  const parent = path.dirname(dataDir);
  try { if (path.basename(parent) === 'supportpages' && !(await readdir(parent)).length) await rm(parent, { recursive: true, force: true }); } catch { /* Not ours to worry about. */ }
  if (purge) {
    if ((await lstat(configDir)).isSymbolicLink()) fail('unsafe_configuration', `Keep the linked configuration path: ${clean(configDir)}`);
    await rm(configDir, { recursive: true, force: true });
  }
  ui.ok('SupportPages Writer removed from this computer.');
  if (keptConfig) ui.line(`Your sign-in and project bindings are kept in ${clean(configDir)}; delete it to forget them.`);
  ui.line('Restart existing coding-agent sessions to unload the removed integrations.');
  ui.line('To reinstall: curl -fsSL https://wtfm.sh/install | bash');
  return { status: 'uninstalled', data_dir: dataDir, launchers, config_dir: purge ? null : configDir, integrations: integrations.status };
}

async function reportUninstall({ configDir, installRoot, env, fetcher, config }) {
  try {
    const dev = developmentMode(env.SUPPORTPAGES_DEV);
    const telemetry = configureTelemetry({ configDir, origin: apiOrigin(env.SUPPORTPAGES_API_URL ?? defaultOrigin(dev), dev), installRoot, env, fetcher });
    if (!await telemetry.installId()) return;
    telemetry.track('uninstall', { config });
    await telemetry.drain();
  } catch { /* Reporting only. */ }
  finally { configureTelemetry(undefined); }
}
