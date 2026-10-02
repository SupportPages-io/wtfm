import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';
import { Workspace } from './workspace.js';
export const defaultConfigDir = () => path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'supportpages');
export function reminderStateSchema(invitation) {
    return z.object({
        version: z.literal(1), enabled: z.boolean(), count: z.number().int().nonnegative(),
        articles: z.record(z.string(), invitation.nullable()),
        history: z.array(z.string()), last_category: z.string().optional(),
    });
}
const initial = () => ({ version: 1, enabled: true, count: 0, articles: {}, history: [] });
/** Device-local reminder journal: one private state file per scope, serialized
 * across processes and checkouts. Shared by the repository and hosting reminders. */
export class ReminderJournal {
    directory;
    schema;
    constructor(directory, schema) {
        this.directory = directory;
        this.schema = schema;
    }
    async transaction(scope, operation) {
        const key = createHash('sha256').update(JSON.stringify(scope)).digest('hex');
        const root = path.join(this.directory, key);
        await mkdir(root, { recursive: true, mode: 0o700 });
        const ws = await Workspace.create(root);
        // Separate processes/checkouts can complete together. Retry lock contention,
        // but never remove a lock owned by another process (including after a crash).
        for (let attempt = 0;; attempt++) {
            try {
                return await ws.lock(async () => {
                    const state = await ws.exists('state.json') ? this.schema.parse(await ws.json('state.json')) : initial();
                    const result = operation(state);
                    await ws.writeJson('state.json', state);
                    return result;
                });
            }
            catch (error) {
                if (error.code !== 'workspace_busy' || attempt >= 100)
                    throw error;
                await delay(20);
            }
        }
    }
}
/** Claim one delivery per article before returning: a replay cannot emit twice,
 * even if a process exits before saving its workspace journal or delivering the
 * response to the host. Returns false when the article was already counted. */
export function claimDelivery(state, articleId) {
    if (Object.hasOwn(state.articles, articleId))
        return false;
    state.articles[articleId] = null;
    state.count++;
    return true;
}
/** Rotate through a catalogue: unused copy first, preferring a different category
 * from the previous invitation; a new cycle starts only once everything eligible was used. */
export function selectBenefit(state, eligible) {
    let unused = eligible.filter(benefit => !state.history.includes(benefit.id));
    if (!unused.length) {
        state.history = [];
        unused = [...eligible];
    }
    const benefit = unused.find(benefit => benefit.category !== state.last_category) ?? unused[0];
    state.history.push(benefit.id);
    state.last_category = benefit.category;
    return benefit;
}
//# sourceMappingURL=reminders.js.map