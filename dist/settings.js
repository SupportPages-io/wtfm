import { z } from 'zod';
import { fail } from './errors.js';
export const defaultPreferences = { prefer_background: true, open_when_ready: false };
const settingsSchema = z.object({ preferences: z.object({ prefer_background: z.boolean(), open_when_ready: z.boolean() }) });
export async function preferences(api) {
    let response;
    try {
        response = await api.request('GET', '/mcp/settings');
    }
    catch (error) {
        // Older servers have no settings endpoint. Other failures must stay visible.
        if (error.code === 'not_found')
            return { ...defaultPreferences };
        throw error;
    }
    const parsed = settingsSchema.safeParse(response);
    if (!parsed.success)
        fail('invalid_response', 'SupportPages.io returned invalid documentation preferences.');
    return parsed.data.preferences;
}
//# sourceMappingURL=settings.js.map