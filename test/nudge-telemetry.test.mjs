import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { configureTelemetry, activeTelemetry } from '../dist/telemetry.js';
import { HostingReminders } from '../dist/hosting-benefits.js';
import { RepositoryReminders } from '../dist/repository-benefits.js';
import { ACCEPT_WINDOW_MS } from '../dist/reminders.js';
import { reportArticleOffers, OFFER_ACCEPT_WINDOW_MS } from '../dist/article-offers.js';
import { afterBash } from '../scripts/article-reminders.mjs';

// Usage counts for the optional nudges: which were shown, which were taken
// up, and whether they were switched off. Codes and counts only.
const origin = 'https://app.supportpages.io';
async function setup(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'supportpages-nudges-'));
  const calls = [];
  configureTelemetry({ configDir: dir, origin, env: {}, fetcher: async (_url, init) => { calls.push(JSON.parse(init.body)); return new Response(null, { status: 202 }); } });
  t.after(async () => { configureTelemetry(undefined); await rm(dir, { recursive: true, force: true }); });
  const events = async () => { await activeTelemetry().drain(); return calls.flatMap(call => call.events).filter(event => event.event.startsWith('nudge_')); };
  return { dir, events };
}

test('a hosting invitation reports its benefit and which local article it followed, and counts as taken up once', async t => {
  const { dir, events } = await setup(t);
  const reminders = new HostingReminders(dir);
  const shown = await reminders.complete({ origin, articleId: randomUUID() });

  assert.equal(await reminders.accepted(origin), shown.id, 'a folder moved to a help centre soon after');
  assert.equal(await reminders.accepted(origin), undefined, 'one invitation is never counted twice');
  await reminders.preference(origin, false);
  assert.deepEqual(await events(), [
    { event: 'nudge_shown', properties: { nudge: 'hosting', benefit: shown.id, completions: 1 } },
    { event: 'nudge_accepted', properties: { nudge: 'hosting', benefit: shown.id, completions: 1 } },
    { event: 'nudge_preference', properties: { nudge: 'hosting', enabled: 'off' } },
  ]);
});

test('a hosting invitation seen more than a day ago doesn\'t count as taken up', async t => {
  const { dir } = await setup(t);
  const reminders = new HostingReminders(dir);
  await reminders.complete({ origin, articleId: randomUUID() });
  const root = path.join(dir, 'hosting-reminders');
  const [key] = await (await import('node:fs/promises')).readdir(root);
  const file = path.join(root, key, 'state.json');
  const state = JSON.parse(await readFile(file, 'utf8'));
  state.last_shown_at = new Date(Date.now() - ACCEPT_WINDOW_MS - 1000).toISOString();
  await writeFile(file, JSON.stringify(state));
  assert.equal(await reminders.accepted(origin), undefined);
});

test('a repository invitation reports its benefit, and its link carries it so SupportPages can count clicks', async t => {
  const { dir, events } = await setup(t);
  const connection = { state: 'not_connected', connect_url: `${origin}/projects/example/repository_connection?source=completion`,
    capabilities: { sections: false, suggestions: false, code_analysis: false, maintenance: false } };
  const invitation = await new RepositoryReminders(dir).complete({ origin, projectId: '1', articleId: randomUUID(), connection });

  const url = new URL(invitation.connect_url);
  assert.equal(url.searchParams.get('source'), 'completion');
  assert.equal(url.searchParams.get('nudge'), invitation.id);
  assert.deepEqual(await events(), [{ event: 'nudge_shown', properties: { nudge: 'repository', benefit: invitation.id, completions: 1 } }]);
});

test('article offers are reported once, and starting an article soon after counts as taking one up', async t => {
  const { dir, events } = await setup(t);
  await afterBash({ configDir: dir, input: { session_id: 's1', tool_input: { command: 'gh pr create --fill' },
    tool_response: { stdout: 'https://github.com/acme/app/pull/7\n' } } });
  const saved = JSON.parse(await readFile(path.join(dir, 'article-reminders.json'), 'utf8'));
  assert.equal(saved.offers.length, 1);
  assert.equal(saved.offers[0].trigger, 'pull_request');

  await reportArticleOffers(dir);
  await reportArticleOffers(dir, { articleStarted: true });
  await reportArticleOffers(dir, { articleStarted: true });
  assert.deepEqual(await events(), [
    { event: 'nudge_shown', properties: { nudge: 'article', trigger: 'pull_request' } },
    { event: 'nudge_accepted', properties: { nudge: 'article', trigger: 'pull_request' } },
  ], 'each offer is reported and taken up at most once');
});

test('an article started long after the offer doesn\'t count as taking it up', async t => {
  const { dir, events } = await setup(t);
  await writeFile(path.join(dir, 'article-reminders.json'), JSON.stringify({ version: 1, pull_requests: [], offered_sessions: [],
    offers: [{ at: new Date(Date.now() - OFFER_ACCEPT_WINDOW_MS - 1000).toISOString(), trigger: 'commit' }] }));
  await reportArticleOffers(dir, { articleStarted: true });
  assert.deepEqual((await events()).map(event => event.event), ['nudge_shown']);
});
