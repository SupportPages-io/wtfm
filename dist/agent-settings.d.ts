import { Workspace } from './workspace.js';
type SettingsWorkspace = {
    ws: Workspace;
    stateRoot: string;
};
export declare const efforts: Record<string, string[]>;
export declare const modelValid: (value: unknown) => value is string;
export declare const settingsFile: (bridge: SettingsWorkspace) => string;
export declare function modelSettings(agent: string, saved?: unknown): {
    model: string | null;
    effort: string | null;
};
export declare function readAgentSettings(bridge: SettingsWorkspace): Promise<{
    [x: string]: unknown;
    models?: Record<string, unknown> | undefined;
    agents?: ("claude" | "codex")[] | undefined;
}>;
export declare function executionSettings(bridge: SettingsWorkspace, agent: string): Promise<{
    model: string | null;
    effort: string | null;
}>;
export {};
