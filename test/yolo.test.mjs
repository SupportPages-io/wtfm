import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture, context } from './helpers.mjs';
import { runCli } from '../scripts/lib/cli.mjs';
import { Cancelled } from '../scripts/lib/terminal.mjs';
import { Session, credentialLocation } from '../dist/session.js';
import { saveTokenFile, readTokenFile } from '../dist/credentials.js';
import { writerAction } from '../dist/actions.js';
import { activeTelemetry, configureTelemetry } from '../dist/telemetry.js';

const origin = 'https://app.supportpages.io';
const token = 'sp_local_' + 'b'.repeat(64), replacement = 'sp_local_' + 'd'.repeat(64);
const account = { id: '10', email: 'alice@example.com' };
const editor = `${origin}/projects/example/inbox`;
const connectUrl = `${origin}/projects/example/repository_connection?source=writer`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const operation = (overrides = {}) => ({ id: '7', project_id: '1', action: 'generate_help_centre', execution: 'hosted', attempt: 1, status: 'queued', article_id: null,
  result: { stage: 'analysis', sections: 0, recommendations: 0, articles: { total: 0, generated: 0, failed: 0 }, article_limit: 10, editor_url: editor },
  error: null, review_url: editor, created_at: '2026-10-01T10:00:00Z', started_at: null, finished_at: null, ...overrides });
const progress = (status, stage, counts = {}, extra = {}) => operation({ status, ...extra,
  result: { stage, sections: counts.sections ?? 0, recommendations: counts.recommendations ?? 0, articles: { total: counts.total ?? 0, generated: counts.generated ?? 0, failed: counts.failed ?? 0 }, article_limit: 10, editor_url: editor } });
const allowed = name => ({ action: name, allowed: true, execution: name === 'generate_help_centre' ? 'hosted' : 'remote', required_scopes: ['read'], next_step: null });
const denied = (name, code, extra = {}) => ({ action: name, allowed: false, execution: 'hosted', required_scopes: ['read', 'generate'],
  next_step: { code, message: `Complete ${code}.`, requested_action: name, ...extra } });

/**
 * A signed-in, bound folder against a fake SupportPages.io. `decisions` is consumed one
 * per context read (the last repeats); `polls` one per operation read (the last repeats).
 */
async function harness(t, { decisions = [allowed('generate_help_centre')], polls = [], submit, retry, scopes = ['read', 'import', 'projects:create', 'generate'], bound = true, record } = {}) {
  const f = await fixture(t);
  const configDir = path.join(f.root, 'config');
  await saveTokenFile(credentialLocation(origin, configDir).filename, origin, token, account);
  if (bound) await f.ws.writeJson('.rtfm/supportpages/binding.json', { version: 1, project_id: '1', api_origin: origin });
  if (record) await f.ws.writeJson('.rtfm/supportpages/operations/1/help-centre.json', record);
  const requests = [], opened = [], prompts = [], logs = [], telemetry = [];
  let decisionIndex = 0, pollIndex = 0;
  const decision = () => decisions[Math.min(decisionIndex, decisions.length - 1)];
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const route = String(url).replace(`${origin}/api/v1`, '');
    const body = init.body ? JSON.parse(init.body) : undefined;
    requests.push({ method: init.method ?? 'GET', route, body, key: init.headers?.['Idempotency-Key'] });
    if (route === '/mcp/settings') return Response.json({ account, scopes, preferences: { prefer_background: true, open_when_ready: false }, writing_styles: {} });
    if (route === '/projects') return Response.json({ projects: [{ id: '1', name: 'Example', help_centre_url: 'https://example.supportpages.io' }] });
    if (route === '/projects/1/context') {
      const current = decision(); decisionIndex++;
      return Response.json({ ...context, repository_connection: { ...context.repository_connection, state: 'connected',
        writer: { version: 1, actions: Object.fromEntries(writerAction.options.map(name => [name, name === 'generate_help_centre' ? current : allowed(name)])) } } });
    }
    if (route === '/projects/1/writer_operations' && init.method === 'POST') return submit ? submit(body) : Response.json(operation(), { status: 202 });
    if (route.startsWith('/projects/1/writer_operations?idempotency_key=')) return Response.json(polls[0] ?? operation());
    if (route === '/projects/1/writer_operations/7/retry_operation') return retry ? retry(body) : Response.json(operation({ attempt: 2 }), { status: 202 });
    if (route === '/projects/1/writer_operations/7') { const value = polls[Math.min(pollIndex, polls.length - 1)]; pollIndex++; return Response.json(value); }
    if (route === '/mcp/pairings') return Response.json({ pairing_id: 'a'.repeat(64), pairing_secret: 'c'.repeat(64), verification_uri: `${origin}/settings/mcp/connect/${'a'.repeat(64)}`, user_code: 'ABCD-EFGH', expires_at: new Date(Date.now() + 600_000).toISOString(), interval: 3 });
    if (route.endsWith('/poll')) return Response.json({ status: 'approved' });
    if (route.endsWith('/exchange')) return Response.json({ status: 'authorized', api_origin: origin, account, token: replacement, scopes: ['read', 'import', 'projects:create', 'generate'], token_expires_at: new Date(Date.now() + 86400_000).toISOString() });
    if (route.endsWith('/acknowledge')) { scopes = ['read', 'import', 'projects:create', 'generate']; return Response.json({ status: 'completed' }); }
    throw Error(`Unexpected ${init.method ?? 'GET'} ${route}`);
  });
  t.after(() => configureTelemetry(undefined));
  const ui = { line: s => logs.push(s), ok: s => logs.push(s), info: s => logs.push(s), note: (s, title) => logs.push(`${title}\n${s}`), outro: s => logs.push(s),
    confirm: async question => { prompts.push(question); return true; }, choose: async (question, options) => { prompts.push(question); return options[0].value; } };
  const deps = { installRoot: path.resolve('.'), ui, run: async () => ({ code: 1 }), open: async url => { opened.push(url); return false; },
    yoloPollMs: 1, yoloMaxDelayMs: 5, follow: true,
    fetcher: async (url, init) => { telemetry.push(...JSON.parse(init.body).events.map(event => event.event === 'install' ? undefined : event).filter(Boolean)); return new Response(null, { status: 202 }); },
    sessionFactory: value => new Session({ ...value, pairingRuntime: { fetcher: (...args) => globalThis.fetch(...args), now: Date.now, sleep: async () => {} } }),
    env: { SUPPORTPAGES_API_URL: undefined, SUPPORTPAGES_DEV: undefined, SUPPORTPAGES_TELEMETRY: '1', DO_NOT_TRACK: undefined, CI: undefined } };
  const options = { command: 'yolo', workspace: f.root, 'config-dir': configDir, 'api-url': origin };
  // Telemetry writes its install id in the background; let it settle before the fixture is removed.
  const run = async (extra = {}, overrides = {}) => { try { return await runCli({ ...options, ...extra }, { ...deps, ...overrides }); } finally { await activeTelemetry()?.drain(); } };
  const events = async () => { await activeTelemetry()?.drain(); return telemetry; };
  return { f, configDir, requests, opened, prompts, logs, run, deps, events, output: () => logs.join('\n'),
    saved: () => f.ws.json('.rtfm/supportpages/operations/1/help-centre.json') };
}

test('yolo submits with a saved idempotency key, follows every stage and ends with the editor link', async t => {
  const h = await harness(t, { polls: [
    progress('running', 'sections'), progress('running', 'recommendations', { sections: 4 }),
    progress('running', 'articles', { sections: 4, recommendations: 12, total: 10, generated: 3, failed: 1 }),
    progress('succeeded', 'done', { sections: 4, recommendations: 12, total: 10, generated: 9, failed: 1 }, { started_at: '2026-10-01T10:00:01Z', finished_at: '2026-10-01T10:05:00Z' }),
  ] });
  const result = await h.run({ yes: true });
  const post = h.requests.find(request => request.method === 'POST' && request.route === '/projects/1/writer_operations');
  assert.deepEqual(post.body, { action_name: 'generate_help_centre', input: {} });
  assert.match(post.key, UUID);
  assert.deepEqual(await h.saved(), { version: 1, key: post.key, operation_id: '7', reported: '7:1' });
  assert.equal(h.prompts.length, 0, '--yes skips the confirmation');
  assert.equal(result.status, 'succeeded'); assert.equal(result.editor_url, editor);
  const out = h.output();
  for (const expected of ['Sections: 4 accepted', 'Articles to write: 12 recommended', 'Writing drafts: 3 of 10 done · 1 failed', 'Drafts written  9 (1 could not be written)', `Review and publish in SupportPages.io: ${editor}`, 'nothing goes live until you publish it'])
    assert.ok(out.includes(expected), `${expected}\n---\n${out}`);
  assert.ok(!out.includes(token));
  assert.deepEqual(await h.events(), [{ event: 'yolo_started', properties: {} }, { event: 'yolo_completed', properties: { outcome: 'succeeded', duration_s: 300 } }]);
});

test('without --yes the plan and allowance are shown first, and declining starts nothing', async t => {
  const h = await harness(t);
  h.deps.ui.confirm = async question => { h.prompts.push(question); return false; };
  await assert.rejects(h.run(), error => error instanceof Cancelled);
  assert.deepEqual(h.prompts, ['Start writing?']);
  assert.match(h.output(), /Your plan allows 10 more articles \(of 10\), so up to 10 drafts are written\./);
  assert.match(h.output(), /Nothing goes live until you publish it/);
  assert.ok(!h.requests.some(request => request.method === 'POST' && request.route.includes('/writer_operations')));
  assert.deepEqual(await h.events(), []);
});

test('missing permission and repository access run their browser flows, then the run starts', async t => {
  const h = await harness(t, { scopes: ['read', 'import', 'projects:create'], decisions: [
    denied('generate_help_centre', 'permission_required', { missing_scopes: ['generate'] }),
    denied('generate_help_centre', 'repository_required', { url: connectUrl }),
    denied('generate_help_centre', 'repository_required', { url: connectUrl }),
    allowed('generate_help_centre'),
  ], polls: [progress('succeeded', 'done', { sections: 2, recommendations: 2, total: 2, generated: 2 })] });
  const result = await h.run({ yes: true });
  assert.equal(result.status, 'succeeded');
  // Permission consent pairs again and replaces the device token. The pairing's
  // acknowledgment can land after the saved credential; let it finish here.
  for (let i = 0; i < 200 && !h.requests.some(request => request.route.endsWith('/acknowledge')); i++) await new Promise(resolve => setTimeout(resolve, 5));
  assert.ok(h.requests.some(request => request.route === '/mcp/pairings'));
  assert.equal(await readTokenFile(credentialLocation(origin, h.configDir).filename, origin), replacement);
  // The repository page opens once; when the browser cannot open, the link is printed.
  assert.deepEqual(h.opened.filter(url => url === connectUrl), [connectUrl]);
  assert.match(h.output(), /Connect your repository/);
  assert.ok(h.output().includes(connectUrl));
  assert.match(h.output(), /Open the link above in your browser/);
  assert.match(h.output(), /Repository connected\./);
  assert.equal(h.requests.filter(request => request.method === 'POST' && request.route === '/projects/1/writer_operations').length, 1);
});

test('a plan limit opens billing and only continues when the user checks again', async t => {
  const billing = `${origin}/billing`;
  const h = await harness(t, { decisions: [denied('generate_help_centre', 'plan_limit', { url: billing })] });
  h.deps.ui.confirm = async question => { h.prompts.push(question); return false; };
  await assert.rejects(h.run({ yes: true }), error => error instanceof Cancelled && /article allowance/.test(error.message));
  assert.deepEqual(h.opened, [billing]);
  assert.match(h.output(), /No article allowance left/);
  assert.ok(!h.requests.some(request => request.method === 'POST' && request.route.includes('/writer_operations')));
});

test('rerunning while a run is going attaches to it instead of starting another', async t => {
  const key = '11111111-2222-4333-8444-555555555555';
  const h = await harness(t, { record: { version: 1, key, operation_id: '7' }, polls: [
    progress('running', 'articles', { sections: 3, recommendations: 5, total: 5, generated: 1 }),
    progress('succeeded', 'done', { sections: 3, recommendations: 5, total: 5, generated: 5 }),
  ] });
  const result = await h.run();
  assert.equal(result.status, 'succeeded');
  assert.ok(!h.requests.some(request => request.method === 'POST'), 'attaching never submits');
  assert.equal(h.prompts.length, 0);
  assert.match(h.output(), /already writing this help centre/);
  assert.deepEqual((await h.events()).map(event => event.event), ['yolo_completed']);
});

test('a run started elsewhere (409 generation_running) is reported without a second submission', async t => {
  const h = await harness(t, { submit: () => Response.json({ error: { code: 'generation_running', message: 'Wait.' } }, { status: 409 }) });
  const result = await h.run({ yes: true });
  assert.equal(result.status, 'already_running');
  assert.match(h.output(), /already writing this help centre from another session or device/);
  assert.equal(h.requests.filter(request => request.method === 'POST').length, 1);
  assert.deepEqual(await h.events(), []);
});

test('a failed run explains itself, and the next yolo resumes it with retry_operation', async t => {
  const failed = progress('failed', 'recommendations', { sections: 4 }, { error: { code: 'no_sections', message: 'x' }, finished_at: '2026-10-01T10:01:00Z' });
  const h = await harness(t, { polls: [progress('running', 'sections'), failed] });
  await assert.rejects(h.run({ yes: true }), error => error.code === 'no_sections' && /No help-centre sections could be worked out/.test(error.message) && /wtfm yolo to resume/.test(error.message));
  assert.ok(h.output().includes(`Review: ${editor}`));
  assert.deepEqual((await h.events()).map(event => [event.event, event.properties?.outcome, event.properties?.error_code]),
    [['yolo_started', undefined, undefined], ['yolo_completed', 'failed', 'no_sections']]);

  let retried;
  const again = await harness(t, { record: await h.saved(), polls: [failed, progress('succeeded', 'done', { sections: 4, recommendations: 6, total: 6, generated: 6 }, { attempt: 2 })],
    retry: body => { retried = body; return Response.json(progress('queued', 'analysis', {}, { attempt: 2 }), { status: 202 }); } });
  const result = await again.run();
  assert.deepEqual(retried, { expected_attempt: 1 });
  assert.deepEqual(again.prompts, ['Resume writing where it stopped?']);
  assert.equal(result.status, 'succeeded');
  assert.ok(!again.requests.some(request => request.method === 'POST' && request.route === '/projects/1/writer_operations'));
  assert.deepEqual((await again.events()).map(event => event.event), ['yolo_completed']);
});

test('Ctrl+C stops watching and leaves the run going; status reattaches and shows progress', async t => {
  const controller = new AbortController();
  const h = await harness(t, { polls: [progress('running', 'sections')] });
  let reads = 0;
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => { if (String(url).endsWith('/writer_operations/7') && ++reads === 2) controller.abort(); return original(url, init); };
  const result = await h.run({ yes: true }, { signal: controller.signal });
  assert.equal(result.status, 'detached');
  assert.match(h.output(), /keeps writing your help centre; run wtfm status to check on it again/);
  globalThis.fetch = original;

  const status = await harness(t, { record: await h.saved(), polls: [
    progress('running', 'articles', { sections: 2, recommendations: 4, total: 4, generated: 2 }),
    progress('succeeded', 'done', { sections: 2, recommendations: 4, total: 4, generated: 4 }),
  ] });
  await status.run({ command: 'status' });
  assert.match(status.output(), /Help centre writing \(wtfm yolo\): Writing drafts: 2 of 4 done/);
  assert.match(status.output(), /Drafts written  4/);
  assert.ok(status.output().includes(editor));
  const logs = [];
  await status.run({ command: 'status', json: true }, { ui: { ...status.deps.ui, line: s => logs.push(s) } });
  const json = JSON.parse(logs.at(-1));
  assert.equal(json.help_centre_generation.operation_id, '7');
  assert.equal(json.help_centre_generation.status, 'succeeded');
});

test('an unbound folder signs in and chooses a help centre before writing', async t => {
  const h = await harness(t, { bound: false, polls: [progress('succeeded', 'done', { sections: 1, recommendations: 1, total: 1, generated: 1 })] });
  const result = await h.run({ yes: true });
  assert.equal(result.status, 'succeeded');
  assert.deepEqual(await h.f.ws.json('.rtfm/supportpages/binding.json'), { version: 1, project_id: '1', api_origin: origin });
  assert.ok(h.prompts.includes('Choose a help centre') || h.prompts.includes('Connect this help centre?'));
});

test('yolo needs an interactive terminal and accepts --yes but not unrelated flags', () => {
  const cli = path.resolve('scripts/cli.mjs');
  const plain = spawnSync(process.execPath, [cli, 'yolo', '--yes'], { encoding: 'utf8', input: '' });
  assert.equal(plain.status, 2);
  assert.match(plain.stderr, /Run wtfm yolo in an interactive terminal/);
  const invalid = spawnSync(process.execPath, [cli, 'yolo', '--json'], { encoding: 'utf8', input: '' });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /Invalid command or options/);
  const help = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
  assert.match(help.stdout, /yolo {8}Write the whole manual on SupportPages\.io \(account required; drafts only\)/);
});

test('capabilities from a newer or older server parse: unknown actions are ignored and missing ones are unadvertised', async () => {
  const { writerCapabilitiesSchema } = await import('../dist/actions.js');
  const parsed = writerCapabilitiesSchema.parse({ version: 1, actions: { generate_help_centre: allowed('generate_help_centre'), some_future_action: { anything: true } } });
  assert.deepEqual(Object.keys(parsed.actions), ['generate_help_centre']);
  assert.throws(() => writerCapabilitiesSchema.parse({ version: 1, actions: { create_article: { action: 'create_article' } } }));
});
