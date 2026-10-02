import tls from 'node:tls';
/** Development processes also trust CAs already approved in the OS trust store.
 * Keep Node's existing roots, including explicit NODE_EXTRA_CA_CERTS entries.
 * This changes only this process; it never installs certificates or disables TLS.
 */
export declare function configureDevelopmentTLS(origin: string, dev: boolean, certificates?: typeof tls): void;
/** Do not expose fetch's raw cause: it can contain request data or proxy secrets. */
export declare function connectionFailure(error: unknown, dev: boolean, fallback: string): never;
