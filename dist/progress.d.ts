import { z } from 'zod';
import type { Bridge } from './bridge.js';
export declare const progressResponse: z.ZodObject<{
    run_id: z.ZodUUID;
    attempt: z.ZodUUID;
    state: z.ZodEnum<{
        running: "running";
        failed: "failed";
        cancelled: "cancelled";
        interrupted: "interrupted";
        complete: "complete";
        kept: "kept";
        discarded: "discarded";
    }>;
    sequence: z.ZodNumber;
    article: z.ZodObject<{
        repository_connection: z.ZodOptional<z.ZodObject<{
            writer: z.ZodOptional<z.ZodObject<{
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
            }, z.core.$strip>>;
            state: z.ZodEnum<{
                not_connected: "not_connected";
                connected: "connected";
                disconnected: "disconnected";
                suspended: "suspended";
            }>;
            connect_url: z.ZodURL;
            capabilities: z.ZodObject<{
                sections: z.ZodBoolean;
                suggestions: z.ZodBoolean;
                code_analysis: z.ZodBoolean;
                maintenance: z.ZodBoolean;
            }, z.core.$strip>;
        }, z.core.$strip>>;
        id: z.ZodString;
        revision: z.ZodString;
        status: z.ZodEnum<{
            draft: "draft";
            published: "published";
        }>;
        editor_url: z.ZodURL;
        public_url: z.ZodNullable<z.ZodURL>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare function openPreview(url: string): Promise<boolean>;
/** Session-owned relay. The host writer only writes artifacts, never credentials. */
export declare class ProgressRelay {
    private bridge;
    private open;
    private timer?;
    private running;
    private failures;
    private generation;
    constructor(bridge: Bridge, open?: typeof openPreview);
    stop(): void;
    start(id: string): void;
    private schedule;
    ensureStartedUnlocked(id: string): Promise<{
        id: string;
        local_article_id: string;
        artifact_dir: string;
        started_at: string;
        section_id: string | null;
        status: "failed" | "prepared" | "finalized" | "cancelled" | "interrupted";
        skills_version: string;
        article_type?: string | undefined;
        progress?: {
            attempt: string;
            sequence: number;
            next_attempt?: string | undefined;
            article?: {
                id: string;
                revision: string;
                status: "draft" | "published";
                editor_url: string;
                public_url: string | null;
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
            } | undefined;
            article_hash?: string | undefined;
            image_hashes?: Record<string, string> | undefined;
            last_heartbeat?: number | undefined;
            open_attempted?: boolean | undefined;
            browser_opened?: boolean | undefined;
            sync_error?: string | undefined;
            sync_failures?: number | undefined;
            pending?: {
                sequence: number;
                directory: string;
            } | undefined;
        } | undefined;
        title?: string | undefined;
        api_origin?: string | undefined;
        project_id?: string | undefined;
        codebase_dir?: string | undefined;
        prefer_background?: boolean | undefined;
        open_when_ready?: boolean | undefined;
        execution_mode?: "background" | "foreground" | undefined;
        host_task_id?: string | undefined;
        writer_token?: string | undefined;
        writer_started_at?: string | undefined;
        writer_completed_at?: string | undefined;
        first_writer_started_at?: string | undefined;
        ready_for_review_at?: string | undefined;
        repository_invitation?: {
            id: string;
            message: string;
            connect_url: string;
        } | undefined;
        repository_reminder_checked?: boolean | undefined;
        hosting_invitation?: {
            id: string;
            message: string;
        } | undefined;
        hosting_reminder_checked?: boolean | undefined;
        session_id?: string | undefined;
        updated_at?: string | undefined;
        phase?: "published" | "failed" | "prepared" | "cancelled" | "interrupted" | "writing" | "finalizing" | "uploading" | "upload_failed" | "ready_for_review" | "saved" | undefined;
        bundle_dir?: string | undefined;
        bundle_hash?: string | undefined;
        local_export?: {
            directory: string;
            markdown_path?: string | undefined;
            sync_error?: string | undefined;
        } | undefined;
        export_path?: string | undefined;
        remote?: {
            id: string;
            revision: string;
            status: "draft" | "published";
            editor_url: string;
            public_url: string | null;
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
        } | undefined;
        error?: {
            code: string;
            message: string;
        } | undefined;
    }>;
    tick(id: string, scheduled?: boolean, generation?: number): Promise<void>;
    private exportLocalUnlocked;
    sendPendingUnlocked(id: string): Promise<void>;
}
