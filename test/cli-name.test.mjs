import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, symlink, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import * as scriptsBrand from '../scripts/lib/brand.mjs';
import * as serverBrand from '../dist/brand.js';
import { emphasizeCommands } from '../scripts/lib/terminal.mjs';
import { ensureCommandAlias } from '../scripts/lib/prepare-update.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'scripts/cli.mjs');

test('the command is wtfm, supportpages stays an alias, and both brand modules agree', async () => {
  assert.equal(scriptsBrand.CLI_NAME, 'wtfm');
  assert.equal(scriptsBrand.LEGACY_CLI_NAME, 'supportpages');
  assert.deepEqual({ ...serverBrand }, { ...scriptsBrand });
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.bin.wtfm, 'scripts/cli.mjs');
  assert.equal(pkg.bin.supportpages, 'scripts/cli.mjs');
  assert.equal(pkg.name, 'wtfm');
  // The MCP Registry name is persisted and unchanged.
  assert.equal(pkg.mcpName, 'io.github.supportpages-io/supportpages-writer');
});

test('wtfm --help and supportpages --help both work and the help names wtfm', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'wtfm-bin-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const name of ['wtfm', 'supportpages']) {
    await symlink(cli, path.join(dir, name));
    const result = spawnSync(path.join(dir, name), ['--help'], { encoding: 'utf8', env: { ...process.env, PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH } });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^Usage: wtfm <command> \[options\]$/m);
    assert.match(result.stdout, /Run wtfm setup once on this computer and wtfm init inside each/);
    assert.match(result.stdout, /supportpages is an alias for wtfm/);
    assert.doesNotMatch(result.stdout, /Usage: supportpages/);
  }
  const invalid = spawnSync(process.execPath, [cli, 'not-a-command'], { encoding: 'utf8' });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /Run wtfm --help\./);
});

test('the terminal highlights both the wtfm command and the supportpages alias', () => {
  const tty = { isTTY: true };
  for (const name of ['wtfm', 'supportpages']) {
    assert.equal(emphasizeCommands(`Run ${name} init --dev.`, tty, {}), `Run \x1b[1;36m${name} init --dev\x1b[39;22m.`);
  }
  assert.equal(emphasizeCommands('Call supportpages_init.', tty, {}), 'Call supportpages_init.');
});

test('an update adds the wtfm launcher beside an existing managed supportpages launcher', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'wtfm-alias-'));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  const bin = path.join(dataDir, 'bin');
  await mkdir(bin);
  // No receipt, or no managed launcher: nothing changes.
  assert.equal(await ensureCommandAlias(dataDir), false);
  await writeFile(path.join(dataDir, 'install.json'), JSON.stringify({ version: 1, type: 'release', data_dir: dataDir, bin_dir: bin, release_url: 'https://downloads.example' }));
  await writeFile(path.join(bin, 'supportpages'), 'unrelated');
  assert.equal(await ensureCommandAlias(dataDir), false);
  const launcher = "#!/bin/sh\n# SupportPages managed launcher\nexec true\n";
  await writeFile(path.join(bin, 'supportpages'), launcher, { mode: 0o755 });
  assert.equal(await ensureCommandAlias(dataDir), true);
  assert.equal(await readFile(path.join(bin, 'wtfm'), 'utf8'), launcher);
  assert.equal(spawnSync(path.join(bin, 'wtfm')).status, 0);
  // An existing wtfm, managed or not, is never replaced.
  await writeFile(path.join(bin, 'wtfm'), 'someone else');
  assert.equal(await ensureCommandAlias(dataDir), false);
  assert.equal(await readFile(path.join(bin, 'wtfm'), 'utf8'), 'someone else');
});
