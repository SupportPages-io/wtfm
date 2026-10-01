// `wtfm yolo`: write a whole help centre as drafts on SupportPages.io.
// Every account step reuses the terminal flows that init and publish use; the
// writing itself is the server's `generate_help_centre` operation, which this
// command starts, follows and (after a failure) resumes.
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { resolveAction, requireExecution } from '../../dist/actions.js';
import { fail, publicError } from '../../dist/errors.js';
import { track, secondsSince } from '../../dist/telemetry.js';
import { Cancelled } from './terminal.mjs';
import { CLI_NAME } from './brand.mjs';

export const YOLO_ACTION = 'generate_help_centre';
const clean = value => String(value).replace(/[\p{Cc}\p{Cf}]/gu, '');
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
const say = (ui, text) => ui.ok ? ui.ok(text) : ui.line(text);
const inform = (ui, text) => ui.info ? ui.info(text) : ui.line(text);
const pending = operation => ['queued', 'running'].includes(operation.status);
const recordSchema = z.object({ version: z.literal(1), key: z.uuid(), operation_id: z.string().regex(/^[1-9][0-9]*$/).optional(),
  reported: z.string().optional() });

/** What a failed run's code means for the user, in their terms. */
export const failureMeanings = {
  generation_failed: 'SupportPages.io could not finish writing the help centre.',
  invalid_content: 'The generated content could not be saved.',
  no_sections: 'No help-centre sections could be worked out from the repository.',
  invalid_credentials: 'The repository connection stopped working while writing.',
  operation_timeout: 'The run stopped responding and timed out.',
};

/** This folder's run, kept with the other operation journals under .rtfm/supportpages. */
const recordFile = (bridge, projectId) => `${bridge.stateRoot}/operations/${projectId}/help-centre.json`;
export async function readYoloRun(bridge) {
  const { project_id } = await bridge.binding();
  const file = recordFile(bridge, project_id);
  if (!await bridge.ws.exists(file)) return undefined;
  try { const parsed = recordSchema.safeParse(await bridge.ws.json(file)); return parsed.success ? parsed.data : undefined; }
  catch { return undefined; }
}
async function saveYoloRun(bridge, record) {
  const { project_id } = await bridge.binding();
  await bridge.ws.writeJson(recordFile(bridge, project_id), record);
  return record;
}

/** The latest known state of this folder's run, read again from the server; undefined when there is none. */
export async function yoloOperation(bridge) {
  const record = await readYoloRun(bridge);
  if (!record) return undefined;
  if (record.operation_id) return { record, operation: await bridge.hosted.get(record.operation_id, 0, false) };
  // The response to the submission was lost: the key finds it without starting another run.
  try {
    const { project_id } = await bridge.binding();
    const operation = await bridge.api.request('GET', `/projects/${project_id}/writer_operations?idempotency_key=${encodeURIComponent(record.key)}`);
    if (typeof operation?.id !== 'string' || !operation.id) fail('invalid_response', 'The server returned an invalid operation.');
    const found = await bridge.hosted.get(operation.id, 0, false);
    await saveYoloRun(bridge, { ...record, operation_id: found.id });
    return { record: { ...record, operation_id: found.id }, operation: found };
  } catch (error) {
    if (publicError(error).code === 'not_found') return { record };
    throw error;
  }
}

export function describeProgress(result = {}) {
  const articles = result.articles ?? {};
  if (result.stage === 'sections') return 'Working out the sections of your help centre…';
  if (result.stage === 'recommendations') return `Sections: ${result.sections ?? 0} · choosing which articles to write…`;
  if (result.stage === 'articles' || result.stage === 'done') return `Writing drafts: ${articles.generated ?? 0} of ${articles.total ?? 0} done${articles.failed ? ` · ${articles.failed} failed` : ''}`;
  return 'Queued on SupportPages.io · reading the repository analysis…';
}
const stageSummary = (stage, result) => stage === 'analysis' ? 'Repository analysis read'
  : stage === 'sections' ? `Sections: ${result.sections ?? 0} accepted`
  : stage === 'recommendations' ? `Articles to write: ${result.recommendations ?? 0} recommended${result.articles?.total !== undefined ? `, ${result.articles.total} started` : ''}`
  : undefined;
const order = ['analysis', 'sections', 'recommendations', 'articles', 'done'];

/** A render-only progress line; test and plain UIs without one print each change once. */
function progressFor(ui, text) {
  if (ui.progress) return ui.progress(text);
  let last = text; ui.line(text);
  return { update: next => { if (next !== last) { ui.line(next); last = next; } }, stop: message => ui.line(message) };
}

/** Ctrl-C stops this terminal waiting, never the run on SupportPages.io. */
function interruption(deps) {
  const controller = new AbortController();
  const onInterrupt = () => controller.abort();
  process.once('SIGINT', onInterrupt);
  deps.signal?.addEventListener('abort', onInterrupt, { once: true });
  if (deps.signal?.aborted) controller.abort();
  return { signal: controller.signal, done: () => { process.removeListener('SIGINT', onInterrupt); deps.signal?.removeEventListener('abort', onInterrupt); } };
}
const pause = (ms, signal) => new Promise(resolve => {
  if (signal.aborted) return resolve();
  const timer = setTimeout(resolve, ms);
  signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
});

/** Counted once per run attempt, whichever command observes the end. */
async function report(bridge, record, operation) {
  if (pending(operation) || !record) return record;
  const id = `${operation.id}:${operation.attempt}`;
  if (record.reported === id) return record;
  track('yolo_completed', { outcome: operation.status, error_code: operation.error?.code,
    duration_s: secondsSince(operation.created_at, operation.finished_at ? Date.parse(operation.finished_at) : Date.now()) });
  return saveYoloRun(bridge, { ...record, reported: id });
}

/** Poll until the run ends or Ctrl-C detaches; network errors back off rather than end it. */
export async function followYolo(bridge, initial, { ui, deps = {}, record, command = CLI_NAME }) {
  const pollMs = deps.yoloPollMs ?? 3000;
  const interrupt = interruption(deps);
  let operation = initial, stage, progress, delay = pollMs, failures = 0;
  const render = () => {
    const result = operation.result ?? {};
    const next = order.includes(result.stage) ? result.stage : 'analysis';
    if (next !== stage) {
      // A stage that finished between polls is still reported, in order.
      const from = stage === undefined ? -1 : order.indexOf(stage);
      if (progress) { progress.stop(stageSummary(stage, result) ?? describeProgress(result)); progress = undefined; }
      if (stage !== undefined) for (const skipped of order.slice(from + 1, order.indexOf(next))) { const line = stageSummary(skipped, result); if (line) say(ui, line); }
      stage = next;
      if (pending(operation)) progress = progressFor(ui, describeProgress(result));
    } else progress?.update(describeProgress(result));
  };
  try {
    while (true) {
      render();
      if (!pending(operation)) break;
      await pause(delay, interrupt.signal);
      if (interrupt.signal.aborted) {
        const message = `Stopped watching. SupportPages.io keeps writing your help centre; run ${command} status to check on it again.`;
        if (progress) progress.stop(message, 'cancelled'); else ui.line(message);
        return { detached: true, operation };
      }
      try { operation = await bridge.hosted.get(operation.id, 0, false); delay = pollMs; failures = 0; }
      catch (error) {
        const safe = publicError(error);
        if (!['network_error', 'remote_error', 'rate_limited', 'connection_error'].includes(safe.code) || ++failures > (deps.yoloMaxFailures ?? 20)) {
          progress?.stop(`Lost track of the run: ${safe.message}`, 'error');
          ui.line(`SupportPages.io keeps writing. Run ${command} status to check on it again.`);
          throw error;
        }
        delay = Math.min(pollMs * 2 ** failures, deps.yoloMaxDelayMs ?? 30_000);
        progress?.update(`SupportPages.io could not be reached; trying again in ${Math.max(1, Math.round(delay / 1000))}s…`);
      }
    }
  } finally { interrupt.done(); }
  if (progress) { progress.stop(operation.status === 'succeeded' ? 'Writing finished' : 'The run stopped', operation.status === 'succeeded' ? 'success' : 'error'); }
  record = await report(bridge, record ?? await readYoloRun(bridge), operation);
  return { detached: false, operation };
}

/** The closing summary: counts and the editor link, or what failed and how to resume. */
export function summarizeYolo(operation, { ui, resume = `${CLI_NAME} yolo` }) {
  const result = operation.result ?? {};
  const articles = result.articles ?? {};
  const link = result.editor_url ?? operation.review_url;
  if (operation.status === 'succeeded') {
    const lines = [`Sections        ${result.sections ?? 0}`, `Drafts written  ${articles.generated ?? 0}${articles.failed ? ` (${articles.failed} could not be written)` : ''}`,
      ...(link ? [`Review          ${clean(link)}`] : [])];
    if (ui.note) ui.note(lines.join('\n'), 'Your manual is written'); else ui.line(lines.join('\n'));
    const text = (articles.generated ?? 0) === 0 && !(articles.total)
      ? 'No new drafts were needed: every recommended article already exists or your plan has no article allowance left.'
      : `Everything is a draft: nothing goes live until you publish it. Review and publish in SupportPages.io${link ? `: ${clean(link)}` : '.'}`;
    if (ui.outro) ui.outro(text); else ui.line(text);
    return;
  }
  const code = operation.error?.code ?? 'generation_failed';
  const meaning = failureMeanings[code] ?? `The run failed (${clean(code)}).`;
  const kept = articles.generated ? ` The ${plural(articles.generated, 'draft')} already written ${articles.generated === 1 ? 'is' : 'are'} kept.` : '';
  if (kept || link) ui.line(`${kept.trim()}${kept && link ? '\n' : ''}${link ? `Review: ${clean(link)}` : ''}`);
  const hint = code === 'invalid_credentials' ? `Reconnect the repository in SupportPages.io, then run ${resume} to resume.` : `Run ${resume} to resume where it stopped.`;
  fail(code, `${meaning} ${hint}`);
}

/**
 * Route each prerequisite the server reports to the flow that resolves it, and
 * return once generate_help_centre is allowed. Browser steps open their page
 * (or print it) and poll until the server reports a different state.
 */
async function prerequisites(session, deps, helpers, initialBridge, { resuming = false } = {}) {
  const { ui } = deps;
  const open = deps.open;
  let bridge = initialBridge, waited = new Set();
  for (let rounds = 0; rounds < 20; rounds++) {
    const decision = await resolveAction(bridge, YOLO_ACTION);
    if (decision.allowed) { requireExecution(decision, 'hosted'); return bridge; }
    const next = decision.next_step;
    // Resuming reuses the allowance the run already reserved, so a spent plan does not block it.
    if (resuming && next.code === 'plan_limit') return bridge;
    if (next.code === 'authentication_required') {
      await helpers.ensureLogin(session, deps);
      bridge = await session.bridge();
      continue;
    }
    if (next.code === 'permission_required') {
      const scopes = (next.missing_scopes ?? ['generate']).filter(scope => ['publish', 'manage', 'generate'].includes(scope));
      ui.line('Writing on SupportPages.io needs this device to have the “generate” permission. Approve it in your browser; the current sign-in keeps working until you do.');
      await helpers.ensureLogin(session, deps, { scopes });
      bridge = await session.bridge();
      continue;
    }
    const browserStep = /^repository_(required|disconnected|suspended)$|^analysis_(required|failed)$|^analysing$|^plan_limit$/.test(next.code);
    if (!browserStep) requireExecution(decision, 'hosted');
    const titles = { repository_required: 'Connect your repository', repository_disconnected: 'Reconnect your repository', repository_suspended: 'Restore repository access',
      analysing: 'Analysing your repository', analysis_required: 'Analyse your repository', analysis_failed: 'Repository analysis failed', plan_limit: 'No article allowance left' };
    const why = /^repository_/.test(next.code) ? 'SupportPages.io reads your code to write the manual, so it needs access to the repository.'
      : next.code === 'plan_limit' ? 'Your plan has no article allowance left for new drafts.'
      : 'SupportPages.io analyses the repository before it can plan your help centre.';
    const message = `${why}\n${clean(next.message)}${next.url ? `\n\n${clean(next.url)}` : ''}`;
    if (ui.note) ui.note(message, titles[next.code]); else ui.line(message);
    // Each page opens once per run; later polls of the same state only wait.
    if (next.url && next.code !== 'analysing' && !waited.has(next.url)) {
      waited.add(next.url);
      if (!await open(next.url)) ui.line('Open the link above in your browser, then return here.');
    }
    if (next.code === 'plan_limit') {
      if (!await ui.confirm('Check your plan again and continue?', true)) throw new Cancelled(`Stopped. Run ${CLI_NAME} yolo again once your plan has article allowance.`);
      continue;
    }
    await waitForChange(bridge, next.code, deps);
  }
  fail('setup_incomplete', `Setup did not finish. Run ${CLI_NAME} yolo again to continue.`);
}

/** Poll the server's decision until it leaves `code`, e.g. once the repository is connected. */
async function waitForChange(bridge, code, deps) {
  const { ui } = deps;
  const interrupt = interruption(deps);
  const waiting = code === 'analysing' || /^analysis_/.test(code) ? 'Waiting for the repository analysis' : code === 'repository_suspended' ? 'Waiting for repository access' : 'Waiting for the repository connection';
  const progress = progressFor(ui, `${waiting}… Ctrl+C stops waiting.`);
  const deadline = Date.now() + (deps.yoloWaitMs ?? 30 * 60_000);
  try {
    while (Date.now() < deadline) {
      await pause(deps.yoloPollMs ?? 3000, interrupt.signal);
      if (interrupt.signal.aborted) { progress.stop('Stopped waiting.', 'cancelled'); throw new Cancelled(`Stopped waiting. Run ${CLI_NAME} yolo again when that step is done.`); }
      let decision;
      try { decision = await resolveAction(bridge, YOLO_ACTION); }
      catch (error) { if (['network_error', 'remote_error', 'rate_limited'].includes(publicError(error).code)) continue; throw error; }
      if (decision.next_step?.code !== code) { progress.stop(code === 'analysing' || /^analysis_/.test(code) ? 'Repository analysis is ready.' : 'Repository connected.'); return; }
    }
    progress.stop('Still waiting.', 'error');
    fail('setup_incomplete', `That step is not finished yet. Run ${CLI_NAME} yolo again when it is.`);
  } finally { interrupt.done(); }
}

/** Remaining allowance for this help centre, or undefined when the server does not say. */
async function allowance(bridge) {
  try {
    const capacity = (await bridge.context()).article_capacity;
    if (!capacity) return undefined;
    return capacity.limit === null ? { unlimited: true } : { remaining: Math.max(0, capacity.limit - capacity.used), limit: capacity.limit };
  } catch { return undefined; }
}

export async function runYolo({ session, config, options, deps, helpers, root }) {
  const { ui } = deps;
  const command = helpers.authCommand('yolo', config);
  ui.intro?.(`WTFM · Write the whole manual${config.dev ? ' · Development' : ''}`);
  ui.line('SupportPages.io writes your help centre on its servers from your repository. Everything is saved as drafts: nothing goes live until you publish it.');

  // 1. Account: the same browser sign-in as publish.
  const signedIn = await helpers.account(session);
  if (!signedIn) {
    ui.step?.(1, 'Sign in to SupportPages.io', 3);
    const mode = await ui.choose('This needs a SupportPages.io account. How would you like to sign in?', helpers.getStartedChoices.slice(0, 2));
    await helpers.ensureLogin(session, deps, { mode });
  } else await helpers.ensureLogin(session, deps);

  // 2. Help centre: keep this folder's, or bind/create one as publish does.
  let bridge = await session.bridge();
  if (await bridge.destination() !== 'hosted') {
    ui.step?.(2, 'Choose your help centre', 3);
    const status = await session.status();
    if (status.status === 'connection_error') fail('connection_error', status.error?.message ?? `SupportPages.io could not be reached. Check your connection and retry ${command}.`);
    const local = await bridge.local();
    await helpers.chooseHelpCentre(session, bridge, deps, { draft: { writingStyle: local?.writing_style } });
    await helpers.saveProfile(root, config);
    bridge = await session.bridge();
  } else {
    const status = await session.status();
    if (status.status !== 'ready') fail(status.status === 'project_unavailable' ? 'project_unavailable' : 'connection_error',
      status.status === 'project_unavailable' ? `This folder's help centre is no longer available to this account. Run ${helpers.authCommand('init', config)} to choose another.` : status.error?.message ?? `SupportPages.io could not be reached. Retry ${command}.`);
    ui.line(`Help centre: ${clean(status.project.name)}${status.project.help_centre_url ? ` · ${clean(status.project.help_centre_url)}` : ''}`);
  }

  // 3. A run already known to this folder: attach to it, or resume it after a failure.
  ui.step?.(3, 'Write the manual', 3);
  const existing = await yoloOperation(bridge);
  if (existing?.operation && pending(existing.operation)) {
    inform(ui, 'SupportPages.io is already writing this help centre. Showing its progress.');
    return finish(bridge, existing.operation, existing.record);
  }
  if (existing?.operation?.status === 'failed') {
    const code = existing.operation.error?.code ?? 'generation_failed';
    ui.line(`The last run stopped: ${failureMeanings[code] ?? clean(code)} Resuming keeps everything it already wrote.`);
    if (!options.yes && !await ui.confirm('Resume writing where it stopped?', true)) throw new Cancelled(`Nothing was started. Run ${command} to resume later.`);
    bridge = await prerequisites(session, deps, helpers, bridge, { resuming: true });
    let operation;
    try { operation = await bridge.hosted.retry(existing.operation.id, existing.operation.attempt); }
    catch (error) {
      if (error.code === 'generation_running') return attachElsewhere(ui, command);
      throw error;
    }
    return finish(bridge, operation, existing.record);
  }
  if (existing && !existing.operation) {
    // Submitted, but the server never recorded it: start again with the same key.
    return submit(session, deps, helpers, bridge, options, existing.record, command);
  }
  return submit(session, deps, helpers, bridge, options, undefined, command);

  async function finish(current, operation, record) {
    const followed = await followYolo(current, operation, { ui, deps, record, command: CLI_NAME });
    if (followed.detached) return { status: 'detached', operation_id: operation.id, review_url: followed.operation.review_url };
    summarizeYolo(followed.operation, { ui, resume: command });
    const result = followed.operation.result ?? {};
    return { status: followed.operation.status, operation_id: followed.operation.id, editor_url: result.editor_url ?? followed.operation.review_url, result };
  }

  async function submit(currentSession, currentDeps, currentHelpers, current, opts, previous, cmd) {
    for (let attempt = 0; attempt < 3; attempt++) {
      current = await prerequisites(currentSession, currentDeps, currentHelpers, current);
      if (!previous) {
        const capacity = await allowance(current);
        const limit = capacity?.unlimited ? 'Your plan has no article limit, so every recommended article is written.'
          : capacity ? `Your plan allows ${plural(capacity.remaining, 'more article')}${capacity.limit ? ` (of ${capacity.limit})` : ''}, so up to ${plural(capacity.remaining, 'draft')} ${capacity.remaining === 1 ? 'is' : 'are'} written.`
          : 'Up to your plan’s article allowance is written; free plans cover 10 guides.';
        const plan = ['SupportPages.io will, on its servers:', '  1. Work out the sections of your help centre from the repository analysis',
          '  2. Choose the articles your users need', '  3. Write them as drafts', '', limit,
          'Nothing goes live until you publish it. You can close this terminal; the run keeps going.'].join('\n');
        if (ui.note) ui.note(plan, 'Ready to write the manual'); else ui.line(plan);
        if (!opts.yes && !await ui.confirm('Start writing?', true)) throw new Cancelled('Nothing was started.');
      }
      const record = previous ?? { version: 1, key: randomUUID() };
      // The key is saved before submission, so a lost response never starts a second run.
      await saveYoloRun(current, { version: 1, key: record.key });
      let operation;
      try {
        operation = await current.hosted.submit(YOLO_ACTION, {}, { request_id: record.key, decision: await resolveAction(current, YOLO_ACTION) });
      } catch (error) {
        if (error.code === 'generation_running') return attachElsewhere(ui, cmd);
        // A prerequisite changed between the check and the submission: route it again.
        if (['permission_denied', 'plan_limit', 'permission_required'].includes(error.code) || /^(repository_|analysis_|analysing$)/.test(error.code ?? '')) { previous = undefined; continue; }
        throw error;
      }
      const saved = await saveYoloRun(current, { version: 1, key: record.key, operation_id: operation.id });
      track('yolo_started');
      say(ui, 'Started. SupportPages.io is writing your manual.');
      return finish(current, operation, saved);
    }
    fail('setup_incomplete', `The help centre could not be started. Run ${cmd} again.`);
  }
}

/** Another device or session started the run this folder does not know about. */
function attachElsewhere(ui, command) {
  ui.line('SupportPages.io is already writing this help centre from another session or device. Watch it in SupportPages.io; drafts appear in the editor as they are written.');
  return { status: 'already_running', instructions: `Run ${command} again after it finishes to write more.` };
}
