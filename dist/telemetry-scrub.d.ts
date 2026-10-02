export type ErrorReport = {
    error_code: string;
    error_class: string;
    message?: string;
    frames: string[];
};
/** Credentials, emails, URLs' paths and queries, and home directories never leave the device. */
export declare function scrubText(text: string, limit: number): string;
/** Keeps only the Writer's own frames by location; anything else on the
 * machine (the user's project, other packages) becomes <external>. */
export declare function scrubFrame(line: string, installRoot?: string): string;
/** A report for an unexpected error, or undefined for an expected one. */
export declare function errorReport(error: unknown, installRoot?: string): ErrorReport | undefined;
