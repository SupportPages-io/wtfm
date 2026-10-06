import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile, lstat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { uninstallCli } from '../scripts/lib/uninstall.mjs';
import { Cancelled } from '../scripts/lib/terminal.mjs';

const launcher = root => `#!/bin/sh\n# SupportPages managed launcher\nsp_root='${root}'\nexec "$sp_root/current/runtime/bin/node" "$sp_root/current/mcp/scripts/cli.mjs" "$@"\n`;
const absent = filename => assert.rejects(lstat(filename), { code: 'ENOENT' });
const present = async filename => { await lstat(filename); };

/** A managed install laid out like the installer leaves it: …/supportpages/cli
 * with marker, receipt, versions and `current`, launchers in a bin dir, and a
 * config dir beside a credentials file. The install root is the live `current/mcp`. */
async function fixture(t, { type = 'release', marker = true } = {}) {
  const home = await mkdtemp(path.join(os.tmpdir(), 'supportpages-uninstall-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  const share = path.join(home, '.local/share/supportpages');
  const root = path.join(share, 'cli');
  const bin = path.join(home, '.local/bin');
  const config = path.join(home, '.config/supportpages');
  const installRoot = path.join(root, 'versions/0.4.1-darwin-arm64/mcp');
  await mkdir(installRoot, { recursive: true });
  await writeFile(path.join(installRoot, 'package.json'), JSON.stringify({ version: '0.4.1' }));
  await symlink('versions/0.4.1-darwin-arm64', path.join(root, 'current'));
  if (marker) await writeFile(path.join(root, '.supportpages-install'), 'SupportPages CLI installation v1\n');
  await writeFile(path.join(root, 'install.json'), JSON.stringify({ version: 1, type, data_dir: root, bin_dir: bin, release_url: 'https://downloads.example' }));
  await mkdir(bin, { recursive: true });
  await writeFile(path.join(bin, 'supportpages'), launcher(root), { mode: 0o755 });
  await writeFile(path.join(bin, 'wtfm'), launcher(root), { mode: 0o755 });
  await mkdir(path.join(config, 'credentials'), { recursive: true });
  await writeFile(path.join(config, 'credentials/abc.json'), '{"token":"kept-or-purged"}');
  await writeFile(path.join(config, 'preferences.json'), '{"version":1,"install_id":"0f4b6c8a-1d2e-4f30-8a9b-0c1d2e3f4a5b"}');
  const logs = [], removeCalls = [], sent = [];
  let confirmed = true;
  const fetcher = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return new Response(null, { status: 202 }); };
  const ui = { line: s => logs.push(s), ok: s => logs.push(s), intro: s => logs.push(s), confirm: async () => confirmed };
  const deps = { installRoot, home, env: { SUPPORTPAGES_CLI_HOME: path.join(root, 'current') }, ui, run: async () => ({ code: 0 }), fetcher,
    remove: async (options, remoteDeps) => { removeCalls.push({ options, remoteDeps }); return { status: 'removed' }; } };
  return { home, share, root, bin, config, installRoot, deps, logs, removeCalls, sent, options: { command: 'uninstall', 'config-dir': config }, decline: () => { confirmed = false; } };
}

test('uninstall disconnects agents first, then removes the install and launchers, keeping the config', async t => {
  const f = await fixture(t);
  const result = await uninstallCli(f.options, f.deps);
  assert.equal(result.status, 'uninstalled');
  assert.equal(result.integrations, 'removed');
  assert.equal(f.removeCalls.length, 1);
  assert.deepEqual(f.removeCalls[0].options, { command: 'remove', 'config-dir': f.config, yes: true });
  await absent(f.root);
  await absent(f.share, 'the empty shared parent goes too');
  await absent(path.join(f.bin, 'supportpages'));
  await absent(path.join(f.bin, 'wtfm'));
  await present(path.join(f.config, 'credentials/abc.json'));
  assert.equal(result.config_dir, f.config);
  assert.ok(f.logs.some(line => /add --purge-config/.test(line)));
  assert.ok(f.logs.some(line => /wtfm\.sh\/install/.test(line)));
});

test('an uninstall is counted once, anonymously, with whether settings were kept', async t => {
  const f = await fixture(t);
  await uninstallCli(f.options, f.deps);
  assert.equal(f.sent.length, 1);
  assert.equal(f.sent[0].url, 'https://app.supportpages.io/api/v1/writer_telemetry');
  assert.equal(f.sent[0].body.install_id, '0f4b6c8a-1d2e-4f30-8a9b-0c1d2e3f4a5b');
  assert.deepEqual(f.sent[0].body.events, [{ event: 'uninstall', properties: { config: 'kept' } }]);

  const g = await fixture(t);
  await uninstallCli({ ...g.options, 'purge-config': true }, g.deps);
  assert.deepEqual(g.sent.at(-1).body.events, [{ event: 'uninstall', properties: { config: 'purged' } }]);
});

test('no uninstall is reported when telemetry is off, when the install never reported, or when declined', async t => {
  const off = await fixture(t);
  off.deps.env.SUPPORTPAGES_TELEMETRY = '0';
  await uninstallCli(off.options, off.deps);
  assert.equal(off.sent.length, 0);

  const fresh = await fixture(t);
  await writeFile(path.join(fresh.config, 'preferences.json'), '{"version":1}');
  await uninstallCli(fresh.options, fresh.deps);
  assert.equal(fresh.sent.length, 0, 'saying goodbye must not create an install id');

  const declined = await fixture(t);
  declined.decline();
  await assert.rejects(uninstallCli(declined.options, declined.deps), Cancelled);
  assert.equal(declined.sent.length, 0);
});

test('--purge-config also removes the configuration, and a local build is removable', async t => {
  const f = await fixture(t, { type: 'local' });
  const result = await uninstallCli({ ...f.options, 'purge-config': true }, f.deps);
  assert.equal(result.config_dir, null);
  await absent(f.config);
  await absent(f.root);
  assert.ok(f.logs.some(line => /signs this computer out/.test(line)));
});

test('launchers that are not this installation\'s are kept, and a sibling directory keeps the shared parent', async t => {
  const f = await fixture(t);
  await writeFile(path.join(f.bin, 'wtfm'), '#!/bin/sh\necho unrelated\n', { mode: 0o755 });
  await writeFile(path.join(f.bin, 'supportpages'), launcher('/somewhere/else/cli'), { mode: 0o755 });
  await mkdir(path.join(f.share, 'skills/local-renderer-abc'), { recursive: true });
  const result = await uninstallCli(f.options, f.deps);
  assert.deepEqual(result.launchers, []);
  assert.equal(await readFile(path.join(f.bin, 'wtfm'), 'utf8'), '#!/bin/sh\necho unrelated\n');
  await present(path.join(f.bin, 'supportpages'));
  await absent(f.root);
  await present(path.join(f.share, 'skills/local-renderer-abc'));
  assert.equal(f.logs.filter(line => /Keeping .*not this installation/.test(line)).length, 2);
});

test('declining removes nothing and never calls remove', async t => {
  const f = await fixture(t);
  f.decline();
  await assert.rejects(uninstallCli(f.options, f.deps), Cancelled);
  assert.equal(f.removeCalls.length, 0);
  await present(f.root);
  await present(path.join(f.bin, 'wtfm'));
});

test('a failed integration removal stops before any file is deleted', async t => {
  const f = await fixture(t);
  f.deps.remove = async () => { throw Object.assign(new Error('changed'), { code: 'configuration_changed' }); };
  await assert.rejects(uninstallCli(f.options, f.deps), { code: 'configuration_changed' });
  await present(f.root);
  await present(path.join(f.bin, 'wtfm'));
});

test('unmanaged, unmarked and plugin installations are refused', async t => {
  const f = await fixture(t);
  await assert.rejects(uninstallCli(f.options, { ...f.deps, env: {} }), { code: 'unmanaged_installation' });
  await assert.rejects(uninstallCli(f.options, { ...f.deps, env: { ...f.deps.env, SUPPORTPAGES_PLUGIN: 'supportpages-writer' } }), { code: 'plugin_installation' });
  const g = await fixture(t, { marker: false });
  await assert.rejects(uninstallCli(g.options, g.deps), { code: 'invalid_installation' });
  await present(f.root); await present(g.root);
});

test('the CLI exposes uninstall unattended, refuses it from a source checkout, and rejects stray options', async t => {
  const f = await fixture(t);
  const env = { ...process.env, HOME: f.home };
  delete env.SUPPORTPAGES_CLI_HOME;
  const unmanaged = spawnSync(process.execPath, ['scripts/cli.mjs', 'uninstall', '--yes', '--config-dir', f.config], { encoding: 'utf8', env });
  assert.notEqual(unmanaged.status, 0);
  assert.match(unmanaged.stderr + unmanaged.stdout, /source or unmanaged installation/);
  await present(f.root);
  for (const args of [['uninstall', '--workspace', f.home], ['uninstall', '--agent', 'claude'], ['remove', '--purge-config'], ['uninstall', '--dev']]) {
    const invalid = spawnSync(process.execPath, ['scripts/cli.mjs', ...args, '--yes'], { encoding: 'utf8', env });
    assert.equal(invalid.status, 2, args.join(' '));
  }
  const help = spawnSync(process.execPath, ['scripts/cli.mjs', '--help'], { encoding: 'utf8', env });
  assert.match(help.stdout, /uninstall\s+Remove SupportPages Writer from this computer/);
});
