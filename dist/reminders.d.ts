import { z } from 'zod';
export declare const defaultConfigDir: () => string;
export type Benefit = {
    readonly id: string;
    readonly category: string;
    readonly message: string;
};
export type ReminderState<Invitation> = {
    version: 1;
    enabled: boolean;
    count: number;
    articles: Record<string, Invitation | null>;
    history: string[];
    last_category?: string;
};
export declare function reminderStateSchema<Invitation>(invitation: z.ZodType<Invitation>): z.ZodType<ReminderState<Invitation>>;
/** Device-local reminder journal: one private state file per scope, serialized
 * across processes and checkouts. Shared by the repository and hosting reminders. */
export declare class ReminderJournal<Invitation> {
    private directory;
    private schema;
    constructor(directory: string, schema: z.ZodType<ReminderState<Invitation>>);
    transaction<T>(scope: unknown[], operation: (state: ReminderState<Invitation>) => T): Promise<T>;
}
/** Claim one delivery per article before returning: a replay cannot emit twice,
 * even if a process exits before saving its workspace journal or delivering the
 * response to the host. Returns false when the article was already counted. */
export declare function claimDelivery<Invitation>(state: ReminderState<Invitation>, articleId: string): boolean;
/** Rotate through a catalogue: unused copy first, preferring a different category
 * from the previous invitation; a new cycle starts only once everything eligible was used. */
export declare function selectBenefit<B extends Benefit>(state: ReminderState<unknown>, eligible: readonly B[]): B;
