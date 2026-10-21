export class SupportPagesError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
    }
}
export function fail(code, message, details) {
    throw new SupportPagesError(code, message, details);
}
export function publicError(error) {
    if (error instanceof SupportPagesError)
        return { code: error.code, message: error.message, details: error.details };
    return { code: 'internal_error', message: 'The operation failed. Check the local configuration and retry.' };
}
//# sourceMappingURL=errors.js.map