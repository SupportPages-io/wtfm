import type { Bridge } from './bridge.js';
/** Keep the MCP acknowledgement small; the complete run stays available in status. */
export declare function runUpdateAcknowledgement(run: Awaited<ReturnType<Bridge['updateRun']>>, event: 'started' | 'failed' | 'interrupted' | 'cancelled'): {
    instructions?: string | undefined;
    recovery?: string | undefined;
    synchronization_error?: string | undefined;
    error?: {
        code: string;
        message: string;
    } | undefined;
    run_id: string;
    phase: "published" | "failed" | "prepared" | "cancelled" | "interrupted" | "writing" | "finalizing" | "uploading" | "upload_failed" | "ready_for_review" | "saved";
    execution_mode: "background" | "foreground" | undefined;
    editor_url: string | null;
    message: string;
};
export declare function runUpdateText(value: unknown): string;
