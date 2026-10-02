export type Account = {
    id: string;
    email: string;
};
export type Credential = {
    token: string;
    account?: Account;
};
/** Atomic replacement: the delivery is acknowledged only after this is durable. */
export declare function saveTokenFile(filename: string, origin: string, token: string, account?: Account): Promise<void>;
/** Private credentials are origin-bound and never embedded in client config. Version 1 files (token only) are still readable. */
export declare function readCredential(filename: string, origin: string): Promise<Credential>;
export declare function readTokenFile(filename: string, origin: string): Promise<string>;
