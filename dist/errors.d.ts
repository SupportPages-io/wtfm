export declare class SupportPagesError extends Error {
    code: string;
    details?: unknown | undefined;
    constructor(code: string, message: string, details?: unknown | undefined);
}
export declare function fail(code: string, message: string, details?: unknown): never;
export declare function publicError(error: unknown): {
    code: string;
    message: string;
    details: unknown;
} | {
    code: string;
    message: string;
    details?: undefined;
};
