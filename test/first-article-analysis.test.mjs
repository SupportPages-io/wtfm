import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fixture, article, png, context } from './helpers.mjs';
import { ApiClient } from '../dist/api.js';

/** A folder set up to save locally that has never been analysed: no network, no .rtfm cache. */
async function unanalysedLocal(t) {
  const f = await fixture(t, async url => { throw Error(`Unexpected network request: ${url}`); });
  f.bridge.api = new ApiClient('https://app.supportpages.io', undefined, async url => { throw Error(`Unexpected network request: ${url}`); });
  await f.bridge.saveLocal({ version: 1, export_dir: 'output/articles' });
  return f;
}
async function writeArticle(f, prepared) {
  await f.ws.writeJson(`${prepared.artifact_dir}/article.json`, article);
  await f.ws.write(`${prepared.artifact_dir}/block_invite.png`, png);
  await f.ws.writeJson(`${prepared.artifact_dir}/lint_report.json`, { all_passed: true, global_warnings: [] });
}
/** What a full detect-project run leaves behind, following the output contract. */
async function writeAnalysis(f, run) {
  await f.ws.writeJson('.rtfm/branding.json', { framework: 'test', compiled_css_path: '.rtfm/branding.css' });
  await f.ws.writeJson('.rtfm/project_map.json', { framework: 'test', app_type: 'web', route_index: [], dir_map: {} });
  await f.ws.write('.rtfm/branding.css', 'body { color: black; }');
  await f.ws.writeJson(`${run.analysis_dir}/analysis-target.json`, { codebase_dir: '.' });
  await f.ws.write(`${run.analysis_dir}/summary.md`, 'A task board.');
  await f.ws.write(`${run.analysis_dir}/overview.txt`, 'Plan your week.');
}
const runOf = (f, prepared) => f.ws.json(`.rtfm/supportpages/runs/${prepared.run_id}/run.json`);

test('the first article analyses the project instead of refusing, and never points at the terminal', async t => {
  const f = await unanalysedLocal(t);
  const status = await f.bridge.status();
  assert.equal(status.analysis.status, 'required');
  assert.match([status.instructions].flat().join(' '), /first article analyses the app/);
  assert.doesNotMatch(JSON.stringify(status), /wtfm analyse/);

  const prepared = await f.bridge.prepare({ title: 'Invite', article_type: 'how-to' });
  assert.equal(prepared.project_analysis, 'included');
  assert.match(prepared.analysis_message, /analyse your app first/);
  assert.match(prepared.instructions[0], /analysis_message/);
  const run = await runOf(f, prepared);
  assert.match(run.analysis_dir, /^\.rtfm\/supportpages\/setup\/tasks\/[0-9a-f-]{36}$/);
  assert.equal(run.codebase_dir, '.');
  const brief = prepared.task_brief.instructions.join('\n');
  const analysisPath = path.join(f.root, run.analysis_dir);
  assert.match(brief, /run detect-project in full/);
  assert.ok(brief.includes(`RTFM_ANALYZE=full and RTFM_OUTPUT_DIR=${analysisPath}`));
  assert.ok(brief.includes(`${analysisPath}/analysis-target.json`), 'the CLI output contract is included');
  assert.ok(brief.includes(`set RTFM_OUTPUT_DIR back to ${prepared.environment.RTFM_OUTPUT_DIR}`));
  assert.doesNotMatch(JSON.stringify(prepared), /wtfm analyse/);
  // The run context carries no stale summary; the analysis directory is ready for the writer.
  const contextFile = await f.ws.json(path.relative(f.root, prepared.environment.RTFM_CONTEXT_FILE));
  assert.equal(contextFile.project_overview, undefined);
  assert.equal(await f.ws.exists(`${run.analysis_dir}/context.json`), true);
});

test('completing the first article saves its analysis, so the next article skips it', async t => {
  const f = await unanalysedLocal(t);
  const prepared = await f.bridge.prepare({ title: 'Invite', article_type: 'how-to' });
  const run = await runOf(f, prepared);
  await writeAnalysis(f, run);
  await writeArticle(f, prepared);
  const result = await f.bridge.complete({ run_id: prepared.run_id, completed: true });
  assert.equal(result.status, 'saved');
  assert.equal(result.project_analysis.status, 'saved');
  const analysis = await f.bridge.setup.analysis();
  assert.equal(analysis.status, 'ready');
  assert.equal(analysis.output_dir, run.analysis_dir);
  assert.equal(analysis.overview, 'Plan your week.');
  // Repeating completion leaves the saved analysis alone.
  assert.equal((await f.bridge.complete({ run_id: prepared.run_id, completed: true })).project_analysis, undefined);

  const next = await f.bridge.prepare({ title: 'Export tasks', article_type: 'how-to' });
  assert.equal(next.project_analysis, undefined);
  assert.equal((await runOf(f, next)).analysis_dir, undefined);
  assert.doesNotMatch(next.task_brief.instructions.join('\n'), /run detect-project in full/);
  const contextFile = await f.ws.json(path.relative(f.root, next.environment.RTFM_CONTEXT_FILE));
  assert.equal(contextFile.project_overview, 'Plan your week.');
});

test('an unusable analysis never costs the user the article', async t => {
  const f = await unanalysedLocal(t);
  const prepared = await f.bridge.prepare({ title: 'Invite', article_type: 'how-to' });
  await writeArticle(f, prepared);
  const result = await f.bridge.complete({ run_id: prepared.run_id, completed: true });
  assert.equal(result.status, 'saved');
  assert.equal(result.project_analysis.status, 'not_saved');
  assert.match(result.project_analysis.message, /next article analyses the project again/);
  assert.equal((await f.bridge.setup.analysis()).status, 'required');
  assert.equal((await f.bridge.prepare({ title: 'Export tasks', article_type: 'how-to' })).project_analysis, 'included');
});

test('a retried first article still analyses the project', async t => {
  const f = await unanalysedLocal(t);
  const prepared = await f.bridge.prepare({ title: 'Invite', article_type: 'how-to' });
  const retried = await f.bridge.retryArticle({ run_id: prepared.run_id, stopped: true });
  const run = await runOf(f, prepared);
  assert.ok(retried.task_brief.instructions.join('\n').includes(`RTFM_OUTPUT_DIR=${path.join(f.root, run.analysis_dir)}`));
});

test('an incomplete detection is redone by the next article with the app type it asked for', async t => {
  const f = await unanalysedLocal(t);
  await writeAnalysis(f, { analysis_dir: 'output/detect-project' });
  await f.bridge.setup.accept('output/detect-project', 'fixture', '1.0.0');
  const map = await f.ws.json('.rtfm/project_map.json');
  await f.ws.writeJson('.rtfm/project_map.json', { ...map, detection_status: 'incomplete',
    detection_block: 'Source has no web layouts. Explicit app_type=terminal is required by the skill to select the terminal branch.' });
  const status = await f.bridge.status();
  assert.equal(status.analysis.status, 'invalid');
  assert.match([status.instructions].flat().join(' '), /needs app_type=terminal: the next article reruns detection/);
  const prepared = await f.bridge.prepare({ title: 'How to install', article_type: 'how-to' });
  assert.equal(prepared.project_analysis, 'included');
  assert.match(prepared.task_brief.instructions.join('\n'), /run detect-project in full for the workspace with app_type=terminal/);
  assert.equal((await runOf(f, prepared)).analysis_app_type, 'terminal');
});

test('a hosted folder without analysis also analyses in its first article', async t => {
  const f = await fixture(t, async url => Response.json(url.endsWith('/projects') ? { projects: [context.project] } : context));
  await f.bridge.bind('1');
  const prepared = await f.bridge.prepare({ title: 'First article', article_type: 'how-to' });
  assert.equal(prepared.project_analysis, 'included');
  assert.match(prepared.task_brief.instructions.join('\n'), /run detect-project in full/);
});
