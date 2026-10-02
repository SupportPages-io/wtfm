import { z } from 'zod';
declare const deliverySchema: z.ZodObject<{
    status: z.ZodLiteral<"authorized">;
    api_origin: z.ZodString;
    account: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
    }, z.core.$strip>;
    token: z.ZodString;
    scopes: z.ZodArray<z.ZodEnum<{
        read: "read";
        import: "import";
        publish: "publish";
        manage: "manage";
        generate: "generate";
        "projects:create": "projects:create";
    }>>;
    token_expires_at: z.ZodISODateTime;
}, z.core.$strip>;
export type Delivery = z.infer<typeof deliverySchema>;
export type Approval = {
    url: string;
    code: string;
    id: string;
};
export type PairingRuntime = {
    fetcher: typeof fetch;
    now: () => number;
    sleep: (ms: number) => Promise<void>;
};
export declare const REQUIRED_SCOPES: readonly ["read", "import", "projects:create"];
/** Offered alongside the required ones at every sign-in. The approval page is
 * where the user decides what to grant; sending them back to the browser
 * mid-task for one more box is worse than one informed decision up front. */
export declare const OPTIONAL_SCOPES: readonly ["publish", "manage", "generate"];
/** Device sign-in. Bootstrap secrets and delivery responses never leave this native process. */
export declare class Pairing {
    private origin;
    private dev;
    private rt;
    private secret;
    private id;
    private deadline;
    private interval;
    private stopped;
    private done?;
    private failure?;
    private status;
    private approval?;
    private approvalOrigin;
    private requestedScopes;
    constructor(origin: string, dev: boolean, rt?: PairingRuntime);
    /** `label` is the device name shown on the approval page (never a filesystem path). */
    start(label: string, options: {
        client: 'SupportPages Writer' | 'SupportPages Writer MCP';
    }): Promise<Approval>;
    cancel(): void;
    get finished(): boolean;
    result(): {
        status: string;
        verification_uri: string | undefined;
        user_code: string | undefined;
        expires_at: string;
        instructions: string;
    };
    run(save: (delivery: Delivery) => Promise<void>, completed?: () => Promise<void>): void;
    wait(ms?: number): Promise<void>;
    private deliver;
    private request;
}
export {};
