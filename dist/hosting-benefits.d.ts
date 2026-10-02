import { z } from 'zod';
export declare const hostingInvitationSchema: z.ZodObject<{
    id: z.ZodString;
    message: z.ZodString;
}, z.core.$strip>;
export type HostingInvitation = z.infer<typeof hostingInvitationSchema>;
/** Why an anonymous local folder would want a SupportPages.io account. Every
 * message must hold on the free plan a new account lands on. */
export declare const hostingBenefits: readonly [{
    readonly id: "public_url";
    readonly category: "reach";
    readonly short: "a public URL to share with customers";
    readonly message: "Give this article a public URL on your own SupportPages.io help centre, ready to share with customers.";
}, {
    readonly id: "editor_review";
    readonly category: "editing";
    readonly short: "an editor to polish drafts before anyone sees them";
    readonly message: "Review and polish drafts in the SupportPages.io editor, with your screenshots already in place, before anyone else sees them.";
}, {
    readonly id: "ai_answers";
    readonly category: "reach";
    readonly short: "AI answers for the questions customers ask";
    readonly message: "Let customers ask questions on your help centre and get AI answers grounded in your articles.";
}, {
    readonly id: "agent_publishing";
    readonly category: "editing";
    readonly message: "Publish, unpublish and update hosted articles straight from your coding agent, with revision-safe saves that never overwrite browser edits.";
}, {
    readonly id: "free_account";
    readonly category: "usage";
    readonly short: "hosts up to 10 articles and leaves your local files exactly where they are";
    readonly message: "A free SupportPages.io account hosts up to 10 articles, and your local files stay exactly where they are.";
}, {
    readonly id: "one_help_centre";
    readonly category: "organisation";
    readonly message: "Keep every article together in one help centre organised into sections, instead of scattered Markdown files.";
}, {
    readonly id: "next_step_repository";
    readonly category: "hosted";
    readonly message: "Once hosted, connect your repository and let SupportPages.io suggest, generate and maintain articles in the background.";
}];
export declare const setupInvitation: () => string[];
/** The exact paragraph the agent shows after a saved local article: the benefit, then the offer. */
export declare const hostingShowText: (invitation: HostingInvitation) => string;
/** Anonymous users have no context yet: every one of the first three local
 * completions carries a benefit, then every third completion after that. */
export declare const hostingReminderDue: (count: number) => boolean;
/** Device-local preference and deduplication for a whole API origin: an anonymous
 * folder has no help centre to key on, so every local folder on this computer shares it. */
export declare class HostingReminders {
    private journal;
    constructor(configDir?: string);
    private transaction;
    preference(origin: string, enabled?: boolean): Promise<{
        enabled: boolean;
        api_origin: string;
        scope: string;
    }>;
    complete(input: {
        origin: string;
        articleId: string;
    }): Promise<{
        id: "public_url" | "editor_review" | "ai_answers" | "agent_publishing" | "free_account" | "one_help_centre" | "next_step_repository";
        message: "Give this article a public URL on your own SupportPages.io help centre, ready to share with customers." | "Review and polish drafts in the SupportPages.io editor, with your screenshots already in place, before anyone else sees them." | "Let customers ask questions on your help centre and get AI answers grounded in your articles." | "Publish, unpublish and update hosted articles straight from your coding agent, with revision-safe saves that never overwrite browser edits." | "A free SupportPages.io account hosts up to 10 articles, and your local files stay exactly where they are." | "Keep every article together in one help centre organised into sections, instead of scattered Markdown files." | "Once hosted, connect your repository and let SupportPages.io suggest, generate and maintain articles in the background.";
    } | undefined>;
}
