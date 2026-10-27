#!/usr/bin/env node
// The Claude Code and Codex hook that offers a help article when a feature lands.
// Both clients send the same hook input and accept the same output fields.
//
//   node article-reminders.mjs after-bash [--config-dir DIR]
//     After `gh pr create` (not a draft) or `gh pr ready` succeeds, or a commit
//     whose message sounds like a new feature, asks the agent to offer a help
//     article if the work adds something end users will see or use. The agent
//     makes that call, so a throwaway PR gets no offer. At most one offer per
//     session, and once per pull request.
//
// It reads the hook input from stdin, honours the device preference set by
// supportpages_set_article_reminders, and keeps what it offered in
// article-reminders.json beside the preferences. A hook must never delay or
// break the session: any failure exits silently with no output.
import { randomUUID } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STATE_FILE = 'article-reminders.json';
const MAX_PULL_REQUESTS = 50;
const MAX_SESSIONS = 50;
const MAX_OFFERS = 50;

const readJson = async file => {
  try {
    const value = JSON.parse(await readFile(file, 'utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
};

async function writeState(configDir, state) {
  await mkdir(configDir, { recursive: true, mode: 0o700 });
  const file = path.join(configDir, STATE_FILE);
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(state) + '\n', { mode: 0o600 });
    await rename(temporary, file);
  } finally { await rm(temporary, { force: true }); }
}

async function load(configDir) {
  const preferences = await readJson(path.join(configDir, 'preferences.json'));
  const saved = await readJson(path.join(configDir, STATE_FILE));
  const state = {
    version: 1,
    pull_requests: Array.isArray(saved.pull_requests) ? saved.pull_requests.filter(key => typeof key === 'string') : [],
    offered_sessions: Array.isArray(saved.offered_sessions) ? saved.offered_sessions.filter(key => typeof key === 'string') : [],
    // Each offer, for the WTFM server's usage counts (src/article-offers.ts),
    // which marks them reported and, when an article follows, accepted.
    offers: Array.isArray(saved.offers) ? saved.offers.filter(offer => offer && typeof offer.at === 'string' && ['pull_request', 'commit'].includes(offer.trigger)) : [],
  };
  return { enabled: preferences.article_reminders !== false, state };
}

const responseText = response => typeof response === 'string' ? response
  : [response?.stdout, response?.stderr, response?.output].filter(value => typeof value === 'string').join('\n');

const PULL_REQUEST = /(?:^|[;&|(\s])gh\s+pr\s+(create|ready)\b([^;&|]*)/;

/** The pull request a successful `gh pr create` or `gh pr ready` reported, as owner/repo#number. */
export function pullRequestOpened(input = {}) {
  const command = input.tool_input?.command;
  if (typeof command !== 'string') return null;
  const match = command.match(PULL_REQUEST);
  if (!match) return null;
  const [, action, args] = match;
  if (action === 'create' && /(?:^|\s)(--draft|-d)(?=\s|=|$)/.test(args)) return null;
  const output = responseText(input.tool_response);
  // gh prints the new PR's URL on create, and owner/repo#number on ready.
  const url = output.match(/https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/);
  if (url) return `${url[1]}#${url[2]}`;
  const ready = action === 'ready' && output.match(/([\w.-]+\/[\w.-]+)#(\d+)\s+is marked as "ready for review"/);
  return ready ? `${ready[1]}#${ready[2]}` : null;
}

const COMMIT = /(?:^|[;&|(\s])git\s+(?:-C\s+\S+\s+)?commit\b/;
const FEATURE = /^(?:feat(?:\([^)]*\))?!?:|(?:adds?|added|introduce[sd]?|implement(?:s|ed)?|support(?:s|ed)?|allow(?:s|ed)?|enable[sd]?|lets?|new|create[sd]?|launch(?:es|ed)?|ship(?:s|ped)?|show(?:s|ed)?)\b)/i;
const NOT_FEATURE = /\b(?:tests?|specs?|typos?|lint|ci|deps|dependenc(?:y|ies)|readme|changelog|logging|comments?)\b/i;

/** The subject of a successful `git commit`. Claude Code usually commits with
 * -q and an inline or heredoc message, so it is read from the command when git
 * printed nothing. Amends are the same work and return null. */
export function commitSubject(input = {}) {
  const command = input.tool_input?.command;
  if (typeof command !== 'string') return null;
  const at = command.search(COMMIT);
  if (at < 0) return null;
  const args = command.slice(at);
  if (/\s--amend\b/.test(args)) return null;
  const output = responseText(input.tool_response);
  if (/nothing to commit|no changes added to commit|^(?:error|fatal):/m.test(output)) return null;
  const printed = output.match(/^\[[^\]\n]+ [0-9a-f]{7,}\] (.+)$/m)?.[1];
  const flag = String.raw`\s(?:-[a-zA-Z]*m|--message)(?:\s+|=)`;
  const message = printed
    ?? args.match(/<<-?\s*['"]?(\w+)['"]?\n([\s\S]*?)\n\s*\1\b/)?.[2]
    ?? args.match(new RegExp(flag + String.raw`"((?:[^"\\]|\\.)*)"`))?.[1]
    ?? args.match(new RegExp(flag + `'([^']*)'`))?.[1];
  return message?.trim().split('\n')[0].trim().slice(0, 200) || null;
}
export const soundsLikeFeature = subject => FEATURE.test(subject) && !NOT_FEATURE.test(subject);

const offer = (what, extra = '') => ({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext:
  `${what} If it adds or changes something end users will see or use${extra}, ` +
  'end your reply with one short line offering to write a help article for it with WTFM (the supportpages tools). ' +
  'If it does not, do not mention WTFM. If the user declines, do not offer again in this conversation.' } });

/** One hook for every Bash call: an opened pull request, or a commit that sounds like a feature. */
export async function afterBash({ configDir, input = {} }) {
  const pr = pullRequestOpened(input);
  const subject = pr ? null : commitSubject(input);
  if (!pr && !(subject && soundsLikeFeature(subject))) return null;
  const { enabled, state } = await load(configDir);
  const session = typeof input.session_id === 'string' ? input.session_id : undefined;
  if (!enabled || session && state.offered_sessions.includes(session) || pr && state.pull_requests.includes(pr)) return null;
  if (pr) state.pull_requests = [...state.pull_requests, pr].slice(-MAX_PULL_REQUESTS);
  if (session) state.offered_sessions = [...state.offered_sessions, session].slice(-MAX_SESSIONS);
  state.offers = [...state.offers, { at: new Date().toISOString(), trigger: pr ? 'pull_request' : 'commit' }].slice(-MAX_OFFERS);
  await writeState(configDir, state);
  return pr ? offer(`The user just opened pull request ${pr}.`)
    : offer(`The user just committed "${subject}".`, ' and the feature looks finished rather than part-way through');
}

const defaultConfigDir = () => path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'supportpages');

async function stdin() {
  if (process.stdin.isTTY) return {};
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  try { return JSON.parse(text); } catch { return {}; }
}

// Installed hooks run through the managed `current` link, while import.meta.url
// is the resolved file: compare real paths, or the hook would silently do nothing.
const invoked = () => { try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } };
if (process.argv[1] && invoked()) {
  try {
    const args = process.argv.slice(2);
    const index = args.indexOf('--config-dir');
    const configDir = path.resolve(index >= 0 && args[index + 1] ? args[index + 1] : defaultConfigDir());
    const hooks = { 'after-bash': afterBash };
    const hook = hooks[args.find((arg, position) => Object.hasOwn(hooks, arg) && position !== index + 1)];
    const output = hook ? await hook({ configDir, input: await stdin() }) : null;
    if (output) process.stdout.write(JSON.stringify(output));
  } catch { /* A hook must never break the session. */ }
}
