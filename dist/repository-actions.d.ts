import type { Bridge } from './bridge.js';
export type RepositoryFeature = 'article_gaps' | 'video_walkthrough';
/** Preserve the requested action through account, permission and repository setup. */
export declare function repositoryAction(bridge: Bridge, action: 'find_article_gaps' | 'create_video_walkthrough' | 'connect_repository', feature?: RepositoryFeature): Promise<{
    instructions: string;
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
    status: string;
}>;
