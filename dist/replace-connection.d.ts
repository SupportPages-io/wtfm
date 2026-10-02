import type { Bridge } from './bridge.js';
/** CLI-only, after the user confirms moving this folder to another help centre. The device credential is untouched. */
export declare function replaceConnection(bridge: Bridge, expectedProjectId: string, projectId: string): Promise<{
    archive: string;
    restored_history: boolean;
}>;
