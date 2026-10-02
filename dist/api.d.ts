export declare function developmentMode(value?: string): boolean;
export declare function defaultOrigin(dev: boolean): string;
export declare function connectionStateRoot(origin: string, dev: boolean): string;
export declare function apiOrigin(value: string, dev?: boolean): string;
export declare const WRITER_FEATURES: readonly ["generate_help_centre"];
export declare class ApiClient {
    private token?;
    private fetcher;
    dev: boolean;
    origin: string;
    constructor(origin: string, token?: string | undefined, fetcher?: typeof fetch, dev?: boolean);
    configured(): boolean;
    request(method: string, route: string, body?: FormData | object, idempotencyKey?: string, timeoutMs?: number): Promise<unknown>;
}
