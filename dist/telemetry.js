import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { devicePreferences, saveDevicePreferences } from './preferences.js';
import { errorReport } from './telemetry-scrub.js';
import { CLI_NAME } from './brand.js';
export const telemetryNotice = 'SupportPages Writer sends anonymous usage counts and crash reports: no code, file paths, article titles or account details. They stay anonymous until you sign in from this machine; after that, usage from this machine is linked to your account. Ask me to turn this off, or set SUPPORTPAGES_TELEMETRY=0.';
const disabledWith = /^(0|false|off|no)$/i;
const MAX_EVENTS = 50;
const MAX_ERRORS = 10;
const BATCH = 20;
export const INSTALL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function telemetryStatus(env, prefs) {
    const setting = env.SUPPORTPAGES_TELEMETRY?.trim();
    if (setting && disabledWith.test(setting))
        return { enabled: false, reason: 'SUPPORTPAGES_TELEMETRY' };
    const doNotTrack = env.DO_NOT_TRACK?.trim();
    if (doNotTrack && !/^(0|false)$/i.test(doNotTrack))
        return { enabled: false, reason: 'DO_NOT_TRACK' };
    // An explicit SUPPORTPAGES_TELEMETRY=1 is the only way to report from CI.
    if (env.CI && !setting)
        return { enabled: false, reason: 'CI' };
    if (prefs.telemetry === false)
        return { enabled: false, reason: 'preference' };
    return { enabled: true, reason: prefs.telemetry === true ? 'preference' : 'default' };
}
export class Telemetry {
    options;
    queue = [];
    queued = 0;
    errors = 0;
    fingerprints = new Set();
    state;
    chain = Promise.resolve();
    pending = false;
    clientName;
    constructor(options) {
        this.options = options;
    }
    get env() { return this.options.env ?? process.env; }
    get endpoint() { return `${this.options.origin}/api/v1/writer_telemetry`; }
    /** The MCP client's self-reported name, e.g. claude-code or codex. */
    setClient(name) { this.clientName = name; }
    /** Creates the install id on first enabled use, which is what counts an install. */
    ready() {
        return this.state ??= (async () => {
            const prefs = await devicePreferences(this.options.configDir);
            if (!telemetryStatus(this.env, prefs).enabled)
                return { enabled: false };
            let installId = typeof prefs.install_id === 'string' && INSTALL_ID.test(prefs.install_id) ? prefs.install_id : undefined;
            if (!installId) {
                installId = randomUUID();
                await saveDevicePreferences(this.options.configDir, { install_id: installId });
                this.queue.unshift({ event: 'install' });
            }
            let version;
            if (this.options.installRoot) {
                try {
                    version = JSON.parse(await readFile(path.join(this.options.installRoot, 'package.json'), 'utf8')).version;
                }
                catch { /* Sent without a version. */ }
            }
            return { enabled: true, installId, version };
        })().catch(() => ({ enabled: false }));
    }
    /** The install id for device sign-in: only while reporting is on and the id
     * already exists. Never creates one, so signing in alone counts no install. */
    async installId() {
        try {
            const prefs = await devicePreferences(this.options.configDir);
            if (!telemetryStatus(this.env, prefs).enabled)
                return undefined;
            return typeof prefs.install_id === 'string' && INSTALL_ID.test(prefs.install_id) ? prefs.install_id : undefined;
        }
        catch {
            return undefined;
        }
    }
    track(event, properties = {}) {
        if (this.queued >= MAX_EVENTS)
            return;
        this.queued += 1;
        // Property values are codes and counts only; anything else (a server
        // message, a title) is dropped rather than sent.
        const safe = Object.fromEntries(Object.entries(properties).filter(([, value]) => typeof value === 'number' ? Number.isInteger(value) && value >= 0 : typeof value === 'string' && /^[a-z][a-z0-9_]{0,63}$/.test(value)));
        this.queue.push({ event, properties: safe });
        this.schedule();
    }
    /** Reports unexpected errors only; expected account and run states are not bugs. */
    error(error, tool) {
        try {
            const report = errorReport(error, this.options.installRoot);
            if (!report)
                return;
            const fingerprint = `${report.error_class}:${report.error_code}:${report.frames[0] ?? ''}`;
            if (this.errors >= MAX_ERRORS || this.queued >= MAX_EVENTS || this.fingerprints.has(fingerprint))
                return;
            this.fingerprints.add(fingerprint);
            this.errors += 1;
            this.queued += 1;
            const { message, frames, ...properties } = report;
            this.queue.push({ event: 'error', properties: { ...properties, tool: tool && /^[a-z][a-z0-9_]{0,63}$/.test(tool) ? tool : undefined }, error: { message, frames } });
            this.schedule();
        }
        catch { /* Reporting must never add a failure of its own. */ }
    }
    schedule() {
        if (this.pending)
            return;
        this.pending = true;
        this.chain = this.chain.then(async () => {
            await Promise.resolve();
            this.pending = false;
            await this.flush();
        }).catch(() => { });
    }
    async flush() {
        const state = await this.ready();
        if (!state.enabled || !state.installId) {
            this.queue = [];
            return;
        }
        while (this.queue.length) {
            const events = this.queue.splice(0, BATCH).map(({ event, properties, error }) => ({
                event, ...(properties ? { properties: Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined)) } : {}), ...(error ? { error } : {}),
            }));
            const body = JSON.stringify({ install_id: state.installId, context: {
                    writer_version: state.version, host_client: this.clientName?.()?.slice(0, 64),
                    os: process.platform, arch: process.arch, node_major: process.versions.node.split('.')[0],
                }, events });
            if (/^(1|true)$/i.test(this.env.SUPPORTPAGES_TELEMETRY_DEBUG ?? ''))
                (this.options.log ?? (line => process.stderr.write(line)))(`${CLI_NAME} telemetry → ${this.endpoint} ${body}\n`);
            try {
                await (this.options.fetcher ?? fetch)(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, redirect: 'error', signal: AbortSignal.timeout(3000) });
            }
            catch { /* Offline, blocked or an older server: counts are best-effort. */ }
        }
    }
    /** Counts a new install as soon as the Writer first runs, before any other event. */
    start() { this.schedule(); }
    /** Resolves once everything queued so far has been sent or dropped. */
    drain() { return this.chain; }
    /** The one-time disclosure, returned the first time it is due and never again. */
    async notice() {
        try {
            const prefs = await devicePreferences(this.options.configDir);
            if (!telemetryStatus(this.env, prefs).enabled || prefs.telemetry_notice_shown)
                return undefined;
            await saveDevicePreferences(this.options.configDir, { telemetry_notice_shown: true });
            return telemetryNotice;
        }
        catch {
            return undefined;
        }
    }
    async status() {
        const prefs = await devicePreferences(this.options.configDir);
        const status = telemetryStatus(this.env, prefs);
        return { ...status, endpoint: this.endpoint,
            ...(typeof prefs.install_id === 'string' ? { install_id: prefs.install_id } : {}),
            sends: 'Anonymous install id, Writer version, coding client name, OS, CPU architecture, Node.js major version; counts of installs, project setups, finished articles, walkthroughs and whole-help-centre runs (with outcome, location and duration); and error class, code and stack frames for unexpected errors. Never code, file paths, article titles or content. The install id is also sent when you sign in from this machine, which links later usage from it to your account; turning telemetry off stops both.',
            disable: `Ask the agent to turn telemetry off (supportpages_set_telemetry), run ${CLI_NAME} telemetry off, or set SUPPORTPAGES_TELEMETRY=0 or DO_NOT_TRACK=1.` };
    }
    async setEnabled(enabled) {
        await saveDevicePreferences(this.options.configDir, { telemetry: enabled, telemetry_notice_shown: true });
        this.state = undefined;
        if (!enabled)
            this.queue = [];
        const status = await this.status();
        return { ...status, message: status.enabled === enabled
                ? `Anonymous usage counts and crash reports are now ${enabled ? 'on' : 'off'} for SupportPages Writer on this device.`
                : `Saved, but ${status.reason} in the environment keeps telemetry ${status.enabled ? 'on' : 'off'}.` };
    }
}
/** One instance per process, configured by the MCP server or CLI entry point.
 * Until then (and in library use or tests) every call is a no-op. */
let active;
export function configureTelemetry(options) { active = options ? new Telemetry(options) : undefined; return active; }
export function activeTelemetry() { return active; }
export function track(event, properties) { active?.track(event, properties); }
export function reportError(error, tool) { active?.error(error, tool); }
export function secondsSince(start, end = Date.now()) {
    const began = start ? Date.parse(start) : NaN;
    return Number.isFinite(began) && end >= began ? Math.round((end - began) / 1000) : undefined;
}
//# sourceMappingURL=telemetry.js.map