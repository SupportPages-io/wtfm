import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterBash, commitSubject, pullRequestOpened, soundsLikeFeature } from '../scripts/article-reminders.mjs';
import { installArticleSkills } from '../scripts/lib/article-skills.mjs';
import { command } from '../scripts/lib/install.mjs';

const script = path.resolve('scripts/article-reminders.mjs');
const configDir = async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'wtfm-reminders-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
};
const preferences = (dir, value) => writeFile(path.join(dir, 'preferences.json'), JSON.stringify({ version: 1, ...value }));
const bash = (cmd, stdout) => ({ tool_name: 'Bash', tool_input: { command: cmd }, tool_response: { stdout, stderr: '' } });

test('only a successful ready pull request is recognised', () => {
  const url = 'https://github.com/acme/app/pull/42\n';
  assert.equal(pullRequestOpened(bash('gh pr create --title "Bulk export" --body x', url)), 'acme/app#42');
  assert.equal(pullRequestOpened(bash('git push -u origin feat && gh pr create --fill', url)), 'acme/app#42');
  assert.equal(pullRequestOpened(bash('gh pr ready 42', '✓ Pull request acme/app#42 is marked as "ready for review"\n')), 'acme/app#42');
  assert.equal(pullRequestOpened(bash('gh pr create --draft --fill', url)), null);
  assert.equal(pullRequestOpened(bash('gh pr create -d --fill', url)), null);
  assert.equal(pullRequestOpened(bash('gh pr create --fill', 'pull request create failed: GraphQL: No commits')), null);
  assert.equal(pullRequestOpened(bash('gh pr view 42', url)), null);
  assert.equal(pullRequestOpened(bash('echo gh-pr-create', url)), null);
  assert.equal(pullRequestOpened({ tool_name: 'Edit', tool_input: { file_path: 'x' } }), null);
});

test('a pull request asks the agent to offer an article once, unless reminders are off', async t => {
  const dir = await configDir(t);
  const opened = bash('gh pr create --fill', 'https://github.com/acme/app/pull/7\n');
  const output = await afterBash({ configDir: dir, input: opened });
  assert.equal(output.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.match(output.hookSpecificOutput.additionalContext, /acme\/app#7.*help article.*WTFM/s);
  assert.equal(await afterBash({ configDir: dir, input: opened }), null);
  await preferences(dir, { article_reminders: false });
  assert.equal(await afterBash({ configDir: dir, input: bash('gh pr create --fill', 'https://github.com/acme/app/pull/9\n') }), null);
});

test('the hook script prints Claude Code hook output and never fails the session', async t => {
  const dir = await configDir(t);
  const run = async (args, input) => {
    const result = await command('/bin/sh', ['-c', `printf '%s' "$INPUT" | "${process.execPath}" "${script}" ${args}`], { capture: true, env: { PATH: '', INPUT: input } });
    assert.equal(result.code, 0, result.stderr);
    return result.stdout;
  };
  const opened = JSON.stringify(bash('gh pr create --fill', 'https://github.com/acme/app/pull/3\n'));
  assert.match(JSON.parse(await run(`--config-dir "${dir}" after-bash`, opened)).hookSpecificOutput.additionalContext, /acme\/app#3/);
  assert.equal(await run(`after-bash --config-dir "${dir}"`, opened), '');
  assert.equal(await run(`after-bash --config-dir "${dir}"`, 'not json'), '');
  await writeFile(path.join(dir, 'article-reminders.json'), '{broken');
  // A corrupt state file starts over rather than silencing the hook.
  assert.match(await run(`after-bash --config-dir "${dir}"`, opened.replace('/3', '/4')), /acme\/app#4/);
  assert.equal(await run('unknown-mode', opened), '');
});

test('installation registers the reminder hooks once, beside the user’s own hooks', async t => {
  const home = await configDir(t);
  await mkdir(path.join(home, '.claude'));
  const file = path.join(home, '.claude/settings.json');
  await writeFile(file, JSON.stringify({ hooks: {
    SessionStart: [{ hooks: [{ type: 'command', command: 'mine' }] }, { hooks: [{ type: 'command', command: "'/old/scripts/article-reminders.mjs' 'session-start'" }] }],
    PostToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'other-hook' }] }],
  } }));
  const writeJson = async (target, data) => writeFile(target, JSON.stringify(data));
  const reminderCommand = [process.execPath, script, '--config-dir', path.join(home, 'config')];
  for (let run = 0; run < 2; run++) await installArticleSkills({ home, client: 'claude', directory: path.join(home, 'engine'), writeJson, reminderCommand });
  const { hooks } = JSON.parse(await readFile(file, 'utf8'));
  // The session reminder earlier builds registered is removed; the user's own hook stays.
  assert.deepEqual(hooks.SessionStart, [{ hooks: [{ type: 'command', command: 'mine' }] }]);
  assert.deepEqual(hooks.PostToolUse.map(group => group.matcher), ['Bash', 'Bash']);
  const pr = hooks.PostToolUse[1].hooks[0].command;
  assert.match(pr, /'after-bash'$/);
  // Hooks run outside the CLI environment: the command must not depend on PATH.
  const result = await command('/bin/sh', ['-c', `printf '%s' "$INPUT" | ${pr}`], { capture: true,
    env: { PATH: '', INPUT: JSON.stringify(bash('gh pr create --fill', 'https://github.com/acme/app/pull/5\n')) } });
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /acme\/app#5/);
});

test('updates add the reminder hooks to installations set up for Claude Code, once', async t => {
  const { prepareUpdate } = await import('../scripts/lib/prepare-update.mjs');
  const root = await configDir(t);
  const next = path.join(root, 'versions/0.6.0/mcp'), previous = path.join(root, 'versions/0.5.7/mcp');
  await mkdir(path.join(next, 'scripts'), { recursive: true });
  await mkdir(previous, { recursive: true });
  await writeFile(path.join(next, 'scripts/article-reminders.mjs'), '');
  await mkdir(path.join(root, '.claude'));
  const file = path.join(root, '.claude/settings.json');
  const trace = `'${path.join(root, 'current/runtime/bin/node')}' '${path.join(root, 'current/mcp/engine/generate-illustrated-article/scripts/trace_hook.js')}'`;
  const options = { home: root, env: {}, run: async () => ({ code: 0, stdout: '' }) };
  // Not set up for Claude Code: nothing is added.
  await writeFile(file, JSON.stringify({ hooks: {} }));
  await prepareUpdate(previous, next, options);
  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')).hooks, {});
  await writeFile(file, JSON.stringify({ hooks: { PostToolUse: [{ matcher: '*', hooks: [{ type: 'command', command: trace }] }] } }));
  await prepareUpdate(previous, next, options);
  await prepareUpdate(previous, next, options);
  const { hooks } = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(hooks.PostToolUse.length, 2);
  assert.equal(hooks.PostToolUse[1].hooks[0].command, `'${path.join(root, 'current/runtime/bin/node')}' '${path.join(root, 'current/mcp/scripts/article-reminders.mjs')}' 'after-bash'`);
  assert.equal(hooks.SessionStart, undefined);
});

test('the hook runs when started through a linked installation directory', async t => {
  const dir = await configDir(t);
  // Installed hooks name the script through the managed `current` link.
  await symlink(path.dirname(script), path.join(dir, 'current'));
  const linked = path.join(dir, 'current', path.basename(script));
  const input = JSON.stringify(bash('gh pr create --fill', 'https://github.com/acme/app/pull/11\n'));
  const result = await command('/bin/sh', ['-c', `printf '%s' "$INPUT" | "${process.execPath}" "${linked}" --config-dir "${dir}" after-bash`], { capture: true, env: { PATH: '', INPUT: input } });
  assert.match(result.stdout, /acme\/app#11/);
});

test('commit subjects are read from git output, heredocs and inline messages', () => {
  const quiet = (cmd) => ({ tool_input: { command: cmd }, tool_response: { stdout: '', stderr: '' } });
  // The shape Claude Code used: a quiet commit with an inline multi-line message.
  assert.equal(commitSubject(quiet('cd /tmp/wt && git add -A && git commit -q -m "Add a Copy link button to the public article page\n\nThe article header gets a button."')),
    'Add a Copy link button to the public article page');
  assert.equal(commitSubject(quiet("git commit -m \"$(cat <<'EOF'\nfeat(export): add bulk CSV export\n\nCo-Authored-By: Claude\nEOF\n)\"")), 'feat(export): add bulk CSV export');
  assert.equal(commitSubject(quiet("git commit -am 'Add dark mode'")), 'Add dark mode');
  assert.equal(commitSubject(bash('git commit -m x', '[main 1a2b3c4] Add team invites\n 3 files changed')), 'Add team invites');
  assert.equal(commitSubject(quiet('git commit --amend -m "Add dark mode"')), null);
  assert.equal(commitSubject(bash('git commit -m "Add dark mode"', 'nothing to commit, working tree clean')), null);
  assert.equal(commitSubject(quiet('git log --oneline')), null);
});

test('only feature-sounding commits are considered', () => {
  for (const subject of ['Add a Copy link button to the public article page', 'feat: bulk export', 'feat(api)!: webhooks', 'Introduce team workspaces', 'Support SAML sign-in', 'Let admins export billing history'])
    assert.ok(soundsLikeFeature(subject), subject);
  for (const subject of ['Fix login redirect', 'Refactor the billing service', 'Add tests for export', 'Add CI caching', 'Bump puppeteer', 'Release Writer 0.5.7', 'chore: tidy', 'Update README', 'Add logging to the importer'])
    assert.ok(!soundsLikeFeature(subject), subject);
});

test('a feature commit asks for an offer, and a session gets at most one offer', async t => {
  const dir = await configDir(t);
  const commit = (subject, session = 's1') => ({ session_id: session, tool_input: { command: `git commit -q -m "${subject}"` }, tool_response: { stdout: '', stderr: '' } });
  assert.equal(await afterBash({ configDir: dir, input: commit('Fix the export button') }), null);
  const output = await afterBash({ configDir: dir, input: commit('Add bulk CSV export') });
  assert.match(output.hookSpecificOutput.additionalContext, /committed "Add bulk CSV export".*looks finished.*WTFM/s);
  // The same session gets no second offer, from a commit or a pull request.
  assert.equal(await afterBash({ configDir: dir, input: commit('Add team invites') }), null);
  assert.equal(await afterBash({ configDir: dir, input: { ...bash('gh pr create --fill', 'https://github.com/acme/app/pull/12\n'), session_id: 's1' } }), null);
  assert.ok(await afterBash({ configDir: dir, input: commit('Add team invites', 's2') }));
});

test('Codex hook input works: the shell output arrives as one plain string', async t => {
  const dir = await configDir(t);
  // Codex reports its shell tool to hooks as Bash, with the output as a string.
  const codex = (command, output, session) => ({ hook_event_name: 'PostToolUse', session_id: session, turn_id: 't', tool_name: 'Bash', tool_input: { command }, tool_response: output });
  assert.equal(pullRequestOpened(codex('gh pr create --fill', 'https://github.com/acme/app/pull/21\n')), 'acme/app#21');
  assert.equal(commitSubject(codex('git commit -m "Add saved searches"', '[main 9f8e7d6] Add saved searches\n 2 files changed\n')), 'Add saved searches');
  const output = await afterBash({ configDir: dir, input: codex('git commit -m "Add saved searches"', '[main 9f8e7d6] Add saved searches\n', 'codex-1') });
  // Codex rejects output with unknown fields, so only these keys may appear.
  assert.deepEqual(Object.keys(output), ['hookSpecificOutput']);
  assert.deepEqual(Object.keys(output.hookSpecificOutput).sort(), ['additionalContext', 'hookEventName']);
});

test('setup for Codex registers the reminder hooks in hooks.json, beside the user’s own hooks', async t => {
  const home = await configDir(t);
  await mkdir(path.join(home, '.codex'));
  const file = path.join(home, '.codex/hooks.json');
  await writeFile(file, JSON.stringify({ description: 'mine', hooks: { Stop: [{ hooks: [{ type: 'command', command: 'notify' }] }] } }));
  const writeJson = async (target, data) => writeFile(target, JSON.stringify(data));
  const reminderCommand = [process.execPath, script, '--config-dir', path.join(home, 'config')];
  for (let run = 0; run < 2; run++) await installArticleSkills({ home, client: 'codex', directory: path.join(home, 'engine'), writeJson, reminderCommand });
  const saved = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(saved.description, 'mine');
  assert.deepEqual(saved.hooks.Stop, [{ hooks: [{ type: 'command', command: 'notify' }] }]);
  assert.equal(saved.hooks.SessionStart, undefined);
  assert.deepEqual(saved.hooks.PostToolUse.map(group => group.matcher), ['Bash']);
  assert.match(saved.hooks.PostToolUse[0].hooks[0].command, /'after-bash'$/);
  // Claude Code was not chosen, so its settings are untouched.
  await assert.rejects(readFile(path.join(home, '.claude/settings.json')), { code: 'ENOENT' });
});

test('updates add the reminder hooks to Codex installations that run this installation', async t => {
  const { prepareUpdate } = await import('../scripts/lib/prepare-update.mjs');
  const root = await configDir(t);
  const next = path.join(root, 'versions/0.6.0/mcp'), previous = path.join(root, 'versions/0.5.7/mcp');
  await mkdir(path.join(next, 'scripts'), { recursive: true });
  await mkdir(previous, { recursive: true });
  await writeFile(path.join(next, 'scripts/article-reminders.mjs'), '');
  await mkdir(path.join(root, '.codex'));
  const options = { home: root, env: {}, run: async () => ({ code: 0, stdout: '' }) };
  await writeFile(path.join(root, '.codex/config.toml'), '[mcp_servers.other]\ncommand = "x"\n');
  await prepareUpdate(previous, next, options);
  await assert.rejects(readFile(path.join(root, '.codex/hooks.json')), { code: 'ENOENT' });
  await writeFile(path.join(root, '.codex/config.toml'), `[mcp_servers.supportpages]\ncommand = "${path.join(root, 'current/runtime/bin/node')}"\n`);
  await prepareUpdate(previous, next, options);
  await prepareUpdate(previous, next, options);
  const { hooks } = JSON.parse(await readFile(path.join(root, '.codex/hooks.json'), 'utf8'));
  assert.equal(hooks.SessionStart, undefined);
  assert.equal(hooks.PostToolUse[0].hooks[0].command, `'${path.join(root, 'current/runtime/bin/node')}' '${path.join(root, 'current/mcp/scripts/article-reminders.mjs')}' 'after-bash'`);
});
