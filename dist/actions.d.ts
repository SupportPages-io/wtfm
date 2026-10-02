import { z } from 'zod';
import type { Bridge } from './bridge.js';
export declare const writerAction: z.ZodEnum<{
    read_articles: "read_articles";
    create_article: "create_article";
    update_article: "update_article";
    edit_article: "edit_article";
    publish_article: "publish_article";
    unpublish_article: "unpublish_article";
    delete_article: "delete_article";
    find_article_gaps: "find_article_gaps";
    suggest_sections: "suggest_sections";
    recommend_articles: "recommend_articles";
    review_sections: "review_sections";
    review_recommendations: "review_recommendations";
    create_video_walkthrough: "create_video_walkthrough";
    get_operation: "get_operation";
    generate_help_centre: "generate_help_centre";
}>;
export type WriterAction = z.infer<typeof writerAction>;
export declare const actionDecisionSchema: z.ZodObject<{
    action: z.ZodEnum<{
        read_articles: "read_articles";
        create_article: "create_article";
        update_article: "update_article";
        edit_article: "edit_article";
        publish_article: "publish_article";
        unpublish_article: "unpublish_article";
        delete_article: "delete_article";
        find_article_gaps: "find_article_gaps";
        suggest_sections: "suggest_sections";
        recommend_articles: "recommend_articles";
        review_sections: "review_sections";
        review_recommendations: "review_recommendations";
        create_video_walkthrough: "create_video_walkthrough";
        get_operation: "get_operation";
        generate_help_centre: "generate_help_centre";
    }>;
    allowed: z.ZodBoolean;
    execution: z.ZodEnum<{
        local: "local";
        remote: "remote";
        hosted: "hosted";
    }>;
    required_scopes: z.ZodArray<z.ZodString>;
    next_step: z.ZodNullable<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        requested_action: z.ZodEnum<{
            read_articles: "read_articles";
            create_article: "create_article";
            update_article: "update_article";
            edit_article: "edit_article";
            publish_article: "publish_article";
            unpublish_article: "unpublish_article";
            delete_article: "delete_article";
            find_article_gaps: "find_article_gaps";
            suggest_sections: "suggest_sections";
            recommend_articles: "recommend_articles";
            review_sections: "review_sections";
            review_recommendations: "review_recommendations";
            create_video_walkthrough: "create_video_walkthrough";
            get_operation: "get_operation";
            generate_help_centre: "generate_help_centre";
        }>;
        missing_scopes: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            read: "read";
            import: "import";
            publish: "publish";
            manage: "manage";
            generate: "generate";
        }>>>;
        url: z.ZodOptional<z.ZodURL>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/** Actions this Writer does not know are ignored and missing ones read as unadvertised,
 * so a server that adds an action never breaks an older Writer (and vice versa). */
export declare const writerCapabilitiesSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    actions: z.ZodPipe<z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodTransform<Partial<Record<"read_articles" | "create_article" | "update_article" | "edit_article" | "publish_article" | "unpublish_article" | "delete_article" | "find_article_gaps" | "suggest_sections" | "recommend_articles" | "review_sections" | "review_recommendations" | "create_video_walkthrough" | "get_operation" | "generate_help_centre", {
        action: "read_articles" | "create_article" | "update_article" | "edit_article" | "publish_article" | "unpublish_article" | "delete_article" | "find_article_gaps" | "suggest_sections" | "recommend_articles" | "review_sections" | "review_recommendations" | "create_video_walkthrough" | "get_operation" | "generate_help_centre";
        allowed: boolean;
        execution: "local" | "remote" | "hosted";
        required_scopes: string[];
        next_step: {
            code: string;
            message: string;
            requested_action: "read_articles" | "create_article" | "update_article" | "edit_article" | "publish_article" | "unpublish_article" | "delete_article" | "find_article_gaps" | "suggest_sections" | "recommend_articles" | "review_sections" | "review_recommendations" | "create_video_walkthrough" | "get_operation" | "generate_help_centre";
            missing_scopes?: ("read" | "import" | "publish" | "manage" | "generate")[] | undefined;
            url?: string | undefined;
        } | null;
    }>>, Record<string, unknown>>>;
}, z.core.$strip>;
export type ActionDecision = z.infer<typeof actionDecisionSchema>;
/** Both terminal and MCP entrypoints use this read-only dispatcher. It never
 * starts authentication or replaces hosted work with a local writer. */
export declare function resolveAction(bridge: Bridge, action: WriterAction, articleId?: string): Promise<ActionDecision>;
export declare function requireExecution(decision: ActionDecision, execution: ActionDecision['execution']): void;
