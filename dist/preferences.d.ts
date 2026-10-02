/** Device-wide preferences that need no account, kept beside the credentials. */
export type DevicePreferences = {
    version?: 1;
    default_destination?: 'local';
    install_id?: string;
    telemetry?: boolean;
    telemetry_notice_shown?: boolean;
    [key: string]: unknown;
};
export declare function devicePreferences(configDir: string): Promise<DevicePreferences>;
/** Atomic private write, like the credentials beside it. */
export declare function saveDevicePreferences(configDir: string, changes: Partial<DevicePreferences>): Promise<{
    version: 1;
    default_destination?: "local";
    install_id?: string;
    telemetry?: boolean;
    telemetry_notice_shown?: boolean;
}>;
