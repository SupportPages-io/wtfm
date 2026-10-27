import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { track } from './telemetry.js';
/** How long after an article offer starting an article counts as taking it up. */
export const OFFER_ACCEPT_WINDOW_MS = 2 * 60 * 60 * 1000;
const STATE_FILE = 'article-reminders.json';
/** Usage counts for the article offers. The offer itself comes from a hook
 * (scripts/article-reminders.mjs), a short-lived process with no telemetry of
 * its own: it records each offer in article-reminders.json, and the server
 * reports them from here. An offer is the hook asking the agent to offer; the
 * agent still decides whether the change is worth an article. Starting an
 * article within OFFER_ACCEPT_WINDOW_MS of the latest offer counts as taking
 * it up. Never throws: counting must not affect the user's request. */
export async function reportArticleOffers(configDir, options = {}) {
    const file = path.join(configDir, STATE_FILE);
    try {
        const state = JSON.parse(await readFile(file, 'utf8'));
        const offers = Array.isArray(state?.offers) ? state.offers : [];
        let changed = false;
        for (const offer of offers) {
            if (offer.reported)
                continue;
            track('nudge_shown', { nudge: 'article', trigger: offer.trigger });
            offer.reported = changed = true;
        }
        const latest = offers.at(-1);
        const now = options.now ?? Date.now();
        if (options.articleStarted && latest && !latest.accepted && now - Date.parse(latest.at) <= OFFER_ACCEPT_WINDOW_MS) {
            track('nudge_accepted', { nudge: 'article', trigger: latest.trigger });
            latest.accepted = changed = true;
        }
        if (!changed)
            return;
        const temporary = `${file}.${randomUUID()}.tmp`;
        try {
            await writeFile(temporary, JSON.stringify(state) + '\n', { mode: 0o600 });
            await rename(temporary, file);
        }
        finally {
            await rm(temporary, { force: true });
        }
    }
    catch { /* No offers yet, or an unreadable file: nothing to report. */ }
}
//# sourceMappingURL=article-offers.js.map