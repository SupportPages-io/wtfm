import { ApiClient } from './api.js';
export declare const defaultPreferences: {
    prefer_background: boolean;
    open_when_ready: boolean;
};
export declare function preferences(api: ApiClient): Promise<{
    prefer_background: boolean;
    open_when_ready: boolean;
}>;
