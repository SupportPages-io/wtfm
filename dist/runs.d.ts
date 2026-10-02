import { z } from 'zod';
import { Workspace } from './workspace.js';
export declare const processSessionId: `${string}-${string}-${string}-${string}-${string}`;
export declare const runSchema: z.ZodObject<{
    id: z.ZodUUID;
    local_article_id: z.ZodUUID;
    artifact_dir: z.ZodString;
    started_at: z.ZodString;
    section_id: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        failed: "failed";
        prepared: "prepared";
        finalized: "finalized";
        cancelled: "cancelled";
        interrupted: "interrupted";
    }>;
    skills_version: z.ZodString;
    article_type: z.ZodOptional<z.ZodString>;
    progress: z.ZodOptional<z.ZodObject<{
        attempt: z.ZodUUID;
        next_attempt: z.ZodOptional<z.ZodUUID>;
        article: z.ZodOptional<z.ZodObject<{
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
        }, z.core.$strip>>;
        sequence: z.ZodNumber;
        article_hash: z.ZodOptional<z.ZodString>;
        image_hashes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        last_heartbeat: z.ZodOptional<z.ZodNumber>;
        open_attempted: z.ZodOptional<z.ZodBoolean>;
        browser_opened: z.ZodOptional<z.ZodBoolean>;
        sync_error: z.ZodOptional<z.ZodString>;
        sync_failures: z.ZodOptional<z.ZodNumber>;
        pending: z.ZodOptional<z.ZodObject<{
            sequence: z.ZodNumber;
            directory: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    title: z.ZodOptional<z.ZodString>;
    api_origin: z.ZodOptional<z.ZodString>;
    project_id: z.ZodOptional<z.ZodString>;
    codebase_dir: z.ZodOptional<z.ZodString>;
    prefer_background: z.ZodOptional<z.ZodBoolean>;
    open_when_ready: z.ZodOptional<z.ZodBoolean>;
    execution_mode: z.ZodOptional<z.ZodEnum<{
        background: "background";
        foreground: "foreground";
    }>>;
    host_task_id: z.ZodOptional<z.ZodString>;
    writer_token: z.ZodOptional<z.ZodUUID>;
    writer_started_at: z.ZodOptional<z.ZodISODateTime>;
    writer_completed_at: z.ZodOptional<z.ZodISODateTime>;
    first_writer_started_at: z.ZodOptional<z.ZodISODateTime>;
    ready_for_review_at: z.ZodOptional<z.ZodISODateTime>;
    repository_invitation: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        message: z.ZodString;
        connect_url: z.ZodURL;
    }, z.core.$strip>>;
    repository_reminder_checked: z.ZodOptional<z.ZodBoolean>;
    hosting_invitation: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>>;
    hosting_reminder_checked: z.ZodOptional<z.ZodBoolean>;
    session_id: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
    phase: z.ZodOptional<z.ZodEnum<{
        published: "published";
        failed: "failed";
        prepared: "prepared";
        cancelled: "cancelled";
        interrupted: "interrupted";
        writing: "writing";
        finalizing: "finalizing";
        uploading: "uploading";
        upload_failed: "upload_failed";
        ready_for_review: "ready_for_review";
        saved: "saved";
    }>>;
    bundle_dir: z.ZodOptional<z.ZodString>;
    bundle_hash: z.ZodOptional<z.ZodString>;
    local_export: z.ZodOptional<z.ZodObject<{
        directory: z.ZodString;
        markdown_path: z.ZodOptional<z.ZodString>;
        sync_error: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    export_path: z.ZodOptional<z.ZodString>;
    remote: z.ZodOptional<z.ZodObject<{
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
    }, z.core.$strip>>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Run = z.infer<typeof runSchema>;
export declare function uploadRecovery(run: Run): string;
export declare class Runs {
    private ws;
    private root;
    private sessionId;
    constructor(ws: Workspace, root: string, sessionId?: `${string}-${string}-${string}-${string}-${string}`);
    read(id: string): Promise<{
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
    save(run: Run): Promise<void>;
    blocking(allowedId?: string): Promise<{
        run: {
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
        };
        state_directory: string;
    } | null>;
    assertAvailable(allowedId?: string): Promise<void>;
    progress(id?: string): Promise<{
        open_when_ready: boolean;
        browser_opened: boolean | undefined;
        instructions: string | undefined;
        editor_url: string | null;
        link_message: string;
        link_instructions: string;
        run_id: string;
        title: string | undefined;
        phase: "published" | "failed" | "prepared" | "cancelled" | "interrupted" | "writing" | "finalizing" | "uploading" | "upload_failed" | "ready_for_review" | "saved";
        generation_completed_locally: boolean;
        delivery_pending: boolean;
        recovery: string | undefined;
        artifact_dir: string;
        execution_mode: "background" | "foreground" | undefined;
        host_task_id: string | undefined;
        progress_source: string;
        session_current: boolean;
        started_at: string;
        updated_at: string;
        project_id: string | undefined;
        error: {
            code: string;
            message: string;
        } | undefined;
        article: {
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
        export_path: string | undefined;
        preview: {
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
        local_preview_path: string | undefined;
        synchronization_error: string | undefined;
    } | null>;
}
