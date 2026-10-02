import { z } from 'zod';
import { repositoryConnectionSchema } from './schema.js';
export declare const repositoryInvitationSchema: z.ZodObject<{
    id: z.ZodString;
    message: z.ZodString;
    connect_url: z.ZodURL;
}, z.core.$strip>;
export type RepositoryInvitation = z.infer<typeof repositoryInvitationSchema>;
export declare const repositoryBenefits: readonly [{
    readonly id: "agent_allowance";
    readonly category: "usage";
    readonly message: "Keep your coding-agent allowance for building your product. Generate future articles using your SupportPages.io plan’s AI allowance.";
}, {
    readonly id: "documentation_allowance";
    readonly category: "usage";
    readonly message: "Let SupportPages.io spend its AI allowance on your documentation, while you keep your coding-agent usage for your product.";
}, {
    readonly id: "next_article_allowance";
    readonly category: "usage";
    readonly message: "Your next article can use your SupportPages.io plan’s AI allowance. Connect your repository to generate it in the web app.";
}, {
    readonly id: "elapsed_generation";
    readonly category: "hosted";
    readonly message: "This draft was ready in {duration}. Next time, let SupportPages.io handle generation without keeping your local coding agent running.";
}, {
    readonly id: "web_generation";
    readonly category: "hosted";
    readonly message: "Create your next article directly in SupportPages.io, without opening a local coding-agent session.";
}, {
    readonly id: "background_generation";
    readonly category: "hosted";
    readonly message: "Let SupportPages.io generate articles in the background while you carry on building your product.";
}, {
    readonly id: "topic_discovery";
    readonly category: "discovery";
    readonly message: "Not sure what to document next? SupportPages.io can suggest articles based on your product’s features.";
}, {
    readonly id: "coverage_gaps";
    readonly category: "discovery";
    readonly message: "Discover features your help centre doesn’t cover yet, with suggestions based on your repository.";
}, {
    readonly id: "section_suggestions";
    readonly category: "organisation";
    readonly message: "Give your help centre a clearer structure with section suggestions based on your product.";
}, {
    readonly id: "organisation";
    readonly category: "organisation";
    readonly message: "Help customers find the right answer by organising your articles into help-centre sections.";
}, {
    readonly id: "change_tracking";
    readonly category: "maintenance";
    readonly message: "Turn merged pull requests into suggestions for documentation your customers might need.";
}, {
    readonly id: "weekly_analysis";
    readonly category: "maintenance";
    readonly message: "Prefer a regular catch-up? Connect your repository and choose weekly analysis of merged pull requests.";
}, {
    readonly id: "maintenance";
    readonly category: "maintenance";
    readonly message: "Spot articles that need updating by comparing your documentation with your code.";
}, {
    readonly id: "automatic_drafts";
    readonly category: "automation";
    readonly message: "Choose automatic draft generation to turn article suggestions into drafts you can review before publishing.";
}, {
    readonly id: "batch_generation";
    readonly category: "automation";
    readonly message: "Work through your documentation backlog by generating multiple suggested articles from the web app.";
}];
/** The exact paragraph the agent shows after a draft review link: the benefit, then the link. */
export declare const repositoryShowText: (invitation: RepositoryInvitation) => string;
export declare function articleDuration(start?: string, ready?: string): string | undefined;
/** Device-local preferences and deduplication, shared by all checkouts of a help centre. */
export declare class RepositoryReminders {
    private journal;
    constructor(configDir?: string);
    private transaction;
    preference(origin: string, projectId: string, enabled?: boolean): Promise<{
        enabled: boolean;
        api_origin: string;
        project_id: string;
        scope: string;
    }>;
    complete(input: {
        origin: string;
        projectId: string;
        articleId: string;
        connection?: z.infer<typeof repositoryConnectionSchema>;
        firstWriterStartedAt?: string;
        readyAt?: string;
    }): Promise<{
        id: "maintenance" | "agent_allowance" | "documentation_allowance" | "next_article_allowance" | "elapsed_generation" | "web_generation" | "background_generation" | "topic_discovery" | "coverage_gaps" | "section_suggestions" | "organisation" | "change_tracking" | "weekly_analysis" | "automatic_drafts" | "batch_generation";
        message: string;
        connect_url: string;
    } | undefined>;
}
