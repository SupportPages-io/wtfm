import { z } from 'zod';
import type { Bridge } from './bridge.js';
import { contextSchema, remoteArticleSchema } from './schema.js';
type Context = z.infer<typeof contextSchema>;
type Local = {
    local_article_id: string;
    artifact_dir: string;
    title?: string;
    run_id?: string;
    phase?: string;
    baseline?: z.infer<typeof remoteArticleSchema>;
    changed: boolean;
    content_changed: boolean;
    bundle_hash?: string;
    generation_attempt?: string;
};
/** Observed remote state is separate from the revision an upload was based on. */
export declare class ProjectSync {
    private bridge;
    constructor(bridge: Bridge);
    localRecords(): Promise<Local[]>;
    refresh(context?: Context, includeWalkthroughs?: boolean): Promise<{
        version: number;
        status: "ready";
        project: {
            name: string;
            id?: string | undefined;
            help_centre_url?: string | undefined;
        };
        api_origin: string;
        walkthroughs: {
            status: "unsupported";
            instructions: string;
            synced_at?: undefined;
            project_id?: undefined;
            api_origin?: undefined;
            items?: undefined;
            counts?: undefined;
        } | {
            status: "ready";
            synced_at: string;
            project_id: string;
            api_origin: string;
            items: {
                id: string;
                remote: {
                    id: string;
                    project_id: string;
                    article_id: string;
                    title: string;
                    slug: string;
                    revision: string;
                    generation_status: "running" | "failed" | "pending" | "completed";
                    ready: boolean;
                    narrated: boolean;
                    publication_pending: boolean;
                    shared: boolean;
                    public_on_article: boolean;
                    review_url: string;
                    playback_url: string | null;
                    public_url: string | null;
                    article_public_url: string | null;
                    assets: {
                        video: boolean;
                        narrated_video: boolean;
                        subtitles: boolean;
                        transcript: boolean;
                        poster: boolean;
                    };
                    created_at: string;
                    updated_at: string;
                    generated_at: string | null;
                    shared_at: string | null;
                    error: {
                        code: string;
                        message: string;
                    } | null;
                    transcript_text?: string | null | undefined;
                    transcript_omitted?: boolean | undefined;
                } | null;
                sync_status: "remote_only" | "synced" | "remote_changed" | "unavailable";
                last_known?: {
                    id: string;
                    project_id: string;
                    article_id: string;
                    title: string;
                    slug: string;
                    revision: string;
                    generation_status: "running" | "failed" | "pending" | "completed";
                    ready: boolean;
                    narrated: boolean;
                    publication_pending: boolean;
                    shared: boolean;
                    public_on_article: boolean;
                    review_url: string;
                    playback_url: string | null;
                    public_url: string | null;
                    article_public_url: string | null;
                    assets: {
                        video: boolean;
                        narrated_video: boolean;
                        subtitles: boolean;
                        transcript: boolean;
                        poster: boolean;
                    };
                    created_at: string;
                    updated_at: string;
                    generated_at: string | null;
                    shared_at: string | null;
                    error: {
                        code: string;
                        message: string;
                    } | null;
                    transcript_text?: string | null | undefined;
                    transcript_omitted?: boolean | undefined;
                } | undefined;
            }[];
            counts: {
                remote: number;
                changed: number;
                unavailable: number;
            };
            instructions: string;
        } | undefined;
        synced_at: string;
        product_context: Record<string, string | string[] | null> | undefined;
        writing_style: string | undefined;
        articles: ({
            identity_mismatch?: true | undefined;
            remote: {
                revision: string;
                status: "draft" | "published";
                editor_url: string;
                public_url: string | null;
                deleted_at: null;
                id: string;
                local_article_id: string | null;
                title: string;
                section_id: string | null;
                repository_connection?: {
                    state: "not_connected" | "connected" | "disconnected" | "suspended";
                    connect_url: string;
                    capabilities: {
                        sections: boolean;
                        suggestions: boolean;
                        code_analysis: boolean;
                        maintenance: boolean;
                    };
                    writer?: {
                        version: 1;
                        actions: Partial<Record<"read_articles" | "create_article" | "update_article" | "edit_article" | "publish_article" | "unpublish_article" | "delete_article" | "find_article_gaps" | "suggest_sections" | "recommend_articles" | "review_sections" | "review_recommendations" | "create_video_walkthrough" | "get_operation" | "generate_help_centre", {
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
                        }>>;
                    } | undefined;
                } | undefined;
                accepted_bundle_hash?: string | null | undefined;
                generation?: {
                    run_id: string;
                    attempt: string;
                    state: "running" | "failed" | "cancelled" | "interrupted" | "complete" | "kept" | "discarded";
                } | null | undefined;
            } | {
                deleted_at: string;
                id: string;
                local_article_id: string | null;
                title: string;
                section_id: string | null;
            } | undefined;
            sync_status: string;
            local_article_id: string;
            artifact_dir: string;
            title?: string;
            run_id?: string;
            phase?: string;
            baseline?: z.infer<typeof remoteArticleSchema>;
            changed: boolean;
            content_changed: boolean;
            bundle_hash?: string;
            generation_attempt?: string;
        } | {
            remote: {
                revision: string;
                status: "draft" | "published";
                editor_url: string;
                public_url: string | null;
                deleted_at: null;
                id: string;
                local_article_id: string | null;
                title: string;
                section_id: string | null;
                repository_connection?: {
                    state: "not_connected" | "connected" | "disconnected" | "suspended";
                    connect_url: string;
                    capabilities: {
                        sections: boolean;
                        suggestions: boolean;
                        code_analysis: boolean;
                        maintenance: boolean;
                    };
                    writer?: {
                        version: 1;
                        actions: Partial<Record<"read_articles" | "create_article" | "update_article" | "edit_article" | "publish_article" | "unpublish_article" | "delete_article" | "find_article_gaps" | "suggest_sections" | "recommend_articles" | "review_sections" | "review_recommendations" | "create_video_walkthrough" | "get_operation" | "generate_help_centre", {
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
                        }>>;
                    } | undefined;
                } | undefined;
                accepted_bundle_hash?: string | null | undefined;
                generation?: {
                    run_id: string;
                    attempt: string;
                    state: "running" | "failed" | "cancelled" | "interrupted" | "complete" | "kept" | "discarded";
                } | null | undefined;
            } | {
                deleted_at: string;
                id: string;
                local_article_id: string | null;
                title: string;
                section_id: string | null;
            };
            sync_status: "remote_only";
        })[];
        counts: {
            local: number;
            remote: number;
            conflicts: number;
            deleted: number;
        };
        instructions: string;
    } | {
        status: "unsupported";
        project: {
            name: string;
            id?: string | undefined;
            help_centre_url?: string | undefined;
        };
        instructions: string;
    }>;
    guard(localId: string, context?: Context): Promise<{
        version: number;
        status: "ready";
        project: {
            name: string;
            id?: string | undefined;
            help_centre_url?: string | undefined;
        };
        api_origin: string;
        walkthroughs: {
            status: "unsupported";
            instructions: string;
            synced_at?: undefined;
            project_id?: undefined;
            api_origin?: undefined;
            items?: undefined;
            counts?: undefined;
        } | {
            status: "ready";
            synced_at: string;
            project_id: string;
            api_origin: string;
            items: {
                id: string;
                remote: {
                    id: string;
                    project_id: string;
                    article_id: string;
                    title: string;
                    slug: string;
                    revision: string;
                    generation_status: "running" | "failed" | "pending" | "completed";
                    ready: boolean;
                    narrated: boolean;
                    publication_pending: boolean;
                    shared: boolean;
                    public_on_article: boolean;
                    review_url: string;
                    playback_url: string | null;
                    public_url: string | null;
                    article_public_url: string | null;
                    assets: {
                        video: boolean;
                        narrated_video: boolean;
                        subtitles: boolean;
                        transcript: boolean;
                        poster: boolean;
                    };
                    created_at: string;
                    updated_at: string;
                    generated_at: string | null;
                    shared_at: string | null;
                    error: {
                        code: string;
                        message: string;
                    } | null;
                    transcript_text?: string | null | undefined;
                    transcript_omitted?: boolean | undefined;
                } | null;
                sync_status: "remote_only" | "synced" | "remote_changed" | "unavailable";
                last_known?: {
                    id: string;
                    project_id: string;
                    article_id: string;
                    title: string;
                    slug: string;
                    revision: string;
                    generation_status: "running" | "failed" | "pending" | "completed";
                    ready: boolean;
                    narrated: boolean;
                    publication_pending: boolean;
                    shared: boolean;
                    public_on_article: boolean;
                    review_url: string;
                    playback_url: string | null;
                    public_url: string | null;
                    article_public_url: string | null;
                    assets: {
                        video: boolean;
                        narrated_video: boolean;
                        subtitles: boolean;
                        transcript: boolean;
                        poster: boolean;
                    };
                    created_at: string;
                    updated_at: string;
                    generated_at: string | null;
                    shared_at: string | null;
                    error: {
                        code: string;
                        message: string;
                    } | null;
                    transcript_text?: string | null | undefined;
                    transcript_omitted?: boolean | undefined;
                } | undefined;
            }[];
            counts: {
                remote: number;
                changed: number;
                unavailable: number;
            };
            instructions: string;
        } | undefined;
        synced_at: string;
        product_context: Record<string, string | string[] | null> | undefined;
        writing_style: string | undefined;
        articles: ({
            identity_mismatch?: true | undefined;
            remote: {
                revision: string;
                status: "draft" | "published";
                editor_url: string;
                public_url: string | null;
                deleted_at: null;
                id: string;
                local_article_id: string | null;
                title: string;
                section_id: string | null;
                repository_connection?: {
                    state: "not_connected" | "connected" | "disconnected" | "suspended";
                    connect_url: string;
                    capabilities: {
                        sections: boolean;
                        suggestions: boolean;
                        code_analysis: boolean;
                        maintenance: boolean;
                    };
                    writer?: {
                        version: 1;
                        actions: Partial<Record<"read_articles" | "create_article" | "update_article" | "edit_article" | "publish_article" | "unpublish_article" | "delete_article" | "find_article_gaps" | "suggest_sections" | "recommend_articles" | "review_sections" | "review_recommendations" | "create_video_walkthrough" | "get_operation" | "generate_help_centre", {
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
                        }>>;
                    } | undefined;
                } | undefined;
                accepted_bundle_hash?: string | null | undefined;
                generation?: {
                    run_id: string;
                    attempt: string;
                    state: "running" | "failed" | "cancelled" | "interrupted" | "complete" | "kept" | "discarded";
                } | null | undefined;
            } | {
                deleted_at: string;
                id: string;
                local_article_id: string | null;
                title: string;
                section_id: string | null;
            } | undefined;
            sync_status: string;
            local_article_id: string;
            artifact_dir: string;
            title?: string;
            run_id?: string;
            phase?: string;
            baseline?: z.infer<typeof remoteArticleSchema>;
            changed: boolean;
            content_changed: boolean;
            bundle_hash?: string;
            generation_attempt?: string;
        } | {
            remote: {
                revision: string;
                status: "draft" | "published";
                editor_url: string;
                public_url: string | null;
                deleted_at: null;
                id: string;
                local_article_id: string | null;
                title: string;
                section_id: string | null;
                repository_connection?: {
                    state: "not_connected" | "connected" | "disconnected" | "suspended";
                    connect_url: string;
                    capabilities: {
                        sections: boolean;
                        suggestions: boolean;
                        code_analysis: boolean;
                        maintenance: boolean;
                    };
                    writer?: {
                        version: 1;
                        actions: Partial<Record<"read_articles" | "create_article" | "update_article" | "edit_article" | "publish_article" | "unpublish_article" | "delete_article" | "find_article_gaps" | "suggest_sections" | "recommend_articles" | "review_sections" | "review_recommendations" | "create_video_walkthrough" | "get_operation" | "generate_help_centre", {
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
                        }>>;
                    } | undefined;
                } | undefined;
                accepted_bundle_hash?: string | null | undefined;
                generation?: {
                    run_id: string;
                    attempt: string;
                    state: "running" | "failed" | "cancelled" | "interrupted" | "complete" | "kept" | "discarded";
                } | null | undefined;
            } | {
                deleted_at: string;
                id: string;
                local_article_id: string | null;
                title: string;
                section_id: string | null;
            };
            sync_status: "remote_only";
        })[];
        counts: {
            local: number;
            remote: number;
            conflicts: number;
            deleted: number;
        };
        instructions: string;
    } | {
        status: "unsupported";
        project: {
            name: string;
            id?: string | undefined;
            help_centre_url?: string | undefined;
        };
        instructions: string;
    }>;
}
export {};
