import { type DevicePreferences } from './preferences.js';
/** Anonymous usage counts and crash reports, on by default and disclosed once.
 * Sent without credentials to the Writer's own API origin. They stay anonymous
 * until the user signs in from this machine: the install id then travels with
 * the device sign-in (Pairing#start), so later usage from this machine can be
 * linked to that account. Turning telemetry off stops both. See
 * docs/writer/client/telemetry.md in the RTFM repo for the exact fields;
 * nothing else is ever sent. */
export type TelemetryEvent = 'project_init' | 'article_completed' | 'walkthrough_completed' | 'yolo_started' | 'yolo_completed';
type Properties = Record<string, string | number | undefined>;
export declare const telemetryNotice = "SupportPages Writer sends anonymous usage counts and crash reports: no code, file paths, article titles or account details. They stay anonymous until you sign in from this machine; after that, usage from this machine is linked to your account. Ask me to turn this off, or set SUPPORTPAGES_TELEMETRY=0.";
export declare const INSTALL_ID: RegExp;
export type TelemetryReason = 'SUPPORTPAGES_TELEMETRY' | 'DO_NOT_TRACK' | 'CI' | 'preference' | 'default';
export declare function telemetryStatus(env: NodeJS.ProcessEnv, prefs: DevicePreferences): {
    enabled: boolean;
    reason: TelemetryReason;
};
export type TelemetryOptions = {
    configDir: string;
    origin: string;
    installRoot?: string;
    env?: NodeJS.ProcessEnv;
    fetcher?: typeof fetch;
    log?: (line: string) => void;
};
export declare class Telemetry {
    private options;
    private queue;
    private queued;
    private errors;
    private fingerprints;
    private state?;
    private chain;
    private pending;
    private clientName?;
    constructor(options: TelemetryOptions);
    private get env();
    get endpoint(): string;
    /** The MCP client's self-reported name, e.g. claude-code or codex. */
    setClient(name: () => string | undefined): void;
    /** Creates the install id on first enabled use, which is what counts an install. */
    private ready;
    /** The install id for device sign-in: only while reporting is on and the id
     * already exists. Never creates one, so signing in alone counts no install. */
    installId(): Promise<string | undefined>;
    track(event: TelemetryEvent, properties?: Properties): void;
    /** Reports unexpected errors only; expected account and run states are not bugs. */
    error(error: unknown, tool?: string): void;
    private schedule;
    private flush;
    /** Counts a new install as soon as the Writer first runs, before any other event. */
    start(): void;
    /** Resolves once everything queued so far has been sent or dropped. */
    drain(): Promise<void>;
    /** The one-time disclosure, returned the first time it is due and never again. */
    notice(): Promise<"SupportPages Writer sends anonymous usage counts and crash reports: no code, file paths, article titles or account details. They stay anonymous until you sign in from this machine; after that, usage from this machine is linked to your account. Ask me to turn this off, or set SUPPORTPAGES_TELEMETRY=0." | undefined>;
    status(): Promise<{
        sends: string;
        disable: string;
        install_id?: string | undefined;
        endpoint: string;
        enabled: boolean;
        reason: TelemetryReason;
    }>;
    setEnabled(enabled: boolean): Promise<{
        message: string;
        sends: string;
        disable: string;
        install_id?: string | undefined;
        endpoint: string;
        enabled: boolean;
        reason: TelemetryReason;
    }>;
}
export declare function configureTelemetry(options: TelemetryOptions | undefined): Telemetry | undefined;
export declare function activeTelemetry(): Telemetry | undefined;
export declare function track(event: TelemetryEvent, properties?: Properties): void;
export declare function reportError(error: unknown, tool?: string): void;
export declare function secondsSince(start?: string, end?: number): number | undefined;
export {};
