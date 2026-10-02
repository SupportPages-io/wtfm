import { HostedOperations } from './hosted-operations.js';
import { z } from 'zod';
import { ApiClient } from './api.js';
import { Workspace } from './workspace.js';
import { contextSchema, remoteArticleSchema, articleType, type Binding, type LocalSettings } from './schema.js';
import { publicError } from './errors.js';
import { LocalSetup } from './local-setup.js';
import { ProgressRelay } from './progress.js';
import { Runs, type Run } from './runs.js';
/** What to do about an analysis that is missing or was rejected by validation. */
export declare function analysisInstruction(analysis: {
    status: string;
    app_type?: unknown;
    error?: {
        message?: string;
    };
}): string | undefined;
export declare class Bridge {
    ws: Workspace;
    api: ApiClient;
    skillsDir: string;
    private sessionId;
    private source?;
    private configDir?;
    readonly relay: ProgressRelay;
    private operations;
    lock<T>(operation: () => Promise<T>): Promise<T>;
    close(): Promise<unknown>;
    get stateRoot(): string;
    constructor(ws: Workspace, api: ApiClient, skillsDir: string, sessionId?: `${string}-${string}-${string}-${string}-${string}`, source?: {
        source_commit: string | null;
        source_dirty: boolean;
    } | undefined, configDir?: string | undefined);
    repositoryReminders(enabled?: boolean): Promise<{
        enabled: boolean;
        api_origin: string;
        project_id: string;
        scope: string;
    }>;
    /** Needs no help centre or sign-in: the preference belongs to this device's local folders. */
    hostingReminders(enabled?: boolean): Promise<{
        enabled: boolean;
        api_origin: string;
        scope: string;
    }>;
    get runs(): Runs;
    resumeWriterCompletion(): Promise<void>;
    get setup(): LocalSetup;
    sync(): Promise<{
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
    localPlan(): Promise<{
        analysis: {
            status: "required";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "invalid";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "ready";
            completed_at: string;
            skills_version: string;
            output_dir: string;
            source_commit: string | null;
            codebase_dir: string;
            summary: string;
            overview: string;
            app_type: "win32" | "web" | "terminal" | "mobile" | "desktop" | "macos" | "game";
            framework: string;
        } | {
            status: "invalid";
            error: {
                code: string;
                message: string;
                details: unknown;
            } | {
                code: string;
                message: string;
                details?: undefined;
            };
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        };
    }>;
    /** Settings of a workspace that saves articles locally; undefined when never set up that way. */
    local(): Promise<LocalSettings | undefined>;
    saveLocal(settings: LocalSettings): Promise<{
        version: 1;
        export_dir: string;
        writing_style?: string | undefined;
        preferences?: {
            prefer_background: boolean;
            open_when_ready: boolean;
        } | undefined;
    }>;
    /** A saved help-centre link always wins over local settings left behind by publish. */
    destination(): Promise<'hosted' | 'local' | 'none'>;
    /** Context for a local workspace: no sections, inventory or capacity; writing style composed here. */
    localContext(): Promise<z.infer<typeof contextSchema>>;
    contextFor(destination: 'hosted' | 'local' | 'none'): Promise<{
        project: {
            name: string;
            id?: string | undefined;
            help_centre_url?: string | undefined;
        };
        supported_bundle_versions: number[];
        sections: {
            id: string;
            name: string;
            slug: string;
            description?: string | null | undefined;
            icon?: string | null | undefined;
        }[];
        articles: {
            id: string;
            title: string;
            section_id: string | null;
        }[];
        inventory_truncated: boolean;
        local?: boolean | undefined;
        article_sync?: boolean | undefined;
        walkthrough_sync?: boolean | undefined;
        article_capacity?: {
            used: number;
            limit: number | null;
            can_create: boolean;
            upgrade_url: string;
            manage_articles_url: string;
        } | undefined;
        progressive_articles?: boolean | undefined;
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
        product_context?: Record<string, string | string[] | null> | undefined;
        project_overview?: string | null | undefined;
        analysis_summary?: string | null | undefined;
        writing_style?: string | undefined;
    }>;
    binding(): Promise<Binding>;
    /** Plugin installs download Chromium in the background when a session starts
     * (scripts/plugin-session.mjs). Say so, rather than failing mid-render. */
    private requirePluginRenderer;
    version(): Promise<string>;
    doctor(): Promise<{
        workspace: string;
        api_origin: string;
        dev_mode: boolean;
        state_directory: string;
        credentials_configured: boolean;
        skills_path: string;
        skills_version: string;
        skills_installed: boolean;
        dependencies: ({
            command: string;
            available: boolean;
            version: string;
        } | {
            command: string;
            available: boolean;
            version?: undefined;
        })[];
        telemetry: unknown;
        notes: string[];
    }>;
    listProjects(): Promise<unknown>;
    status(runId?: string): Promise<{
        status: string;
        export_dir: string;
        writing_style: string | undefined;
        generation_ready: boolean;
        instructions: string;
        workspace: string;
        api_origin: string;
        dev_mode: boolean;
        credentials_configured: boolean;
        article_run: {
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
        } | null;
        analysis: {
            status: "required";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "invalid";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "ready";
            completed_at: string;
            skills_version: string;
            output_dir: string;
            source_commit: string | null;
            codebase_dir: string;
            summary: string;
            overview: string;
            app_type: "win32" | "web" | "terminal" | "mobile" | "desktop" | "macos" | "game";
            framework: string;
        } | {
            status: "invalid";
            error: {
                code: string;
                message: string;
                details: unknown;
            } | {
                code: string;
                message: string;
                details?: undefined;
            };
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        };
        setup_task: {
            progress_source: "last_reported";
            skill: "generate-illustrated-article" | "detect-project" | "suggest-sections" | "recommend-articles";
            status: "running" | "failed" | "cancelled" | "completed";
            started_at: string;
            finished_at?: string | undefined;
            total?: number | undefined;
            completed?: number | undefined;
            failed?: number | undefined;
        } | null;
    } | {
        status: string;
        instructions: string;
        workspace: string;
        api_origin: string;
        dev_mode: boolean;
        credentials_configured: boolean;
        article_run: {
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
        } | null;
        analysis: {
            status: "required";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "invalid";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "ready";
            completed_at: string;
            skills_version: string;
            output_dir: string;
            source_commit: string | null;
            codebase_dir: string;
            summary: string;
            overview: string;
            app_type: "win32" | "web" | "terminal" | "mobile" | "desktop" | "macos" | "game";
            framework: string;
        } | {
            status: "invalid";
            error: {
                code: string;
                message: string;
                details: unknown;
            } | {
                code: string;
                message: string;
                details?: undefined;
            };
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        };
        setup_task: {
            progress_source: "last_reported";
            skill: "generate-illustrated-article" | "detect-project" | "suggest-sections" | "recommend-articles";
            status: "running" | "failed" | "cancelled" | "completed";
            started_at: string;
            finished_at?: string | undefined;
            total?: number | undefined;
            completed?: number | undefined;
            failed?: number | undefined;
        } | null;
        generation_ready: boolean;
    } | {
        status: string;
        projects: {
            id: string;
            name: string;
            help_centre_url?: string | undefined;
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
        }[];
        instructions: string;
        workspace: string;
        api_origin: string;
        dev_mode: boolean;
        credentials_configured: boolean;
        article_run: {
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
        } | null;
        analysis: {
            status: "required";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "invalid";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "ready";
            completed_at: string;
            skills_version: string;
            output_dir: string;
            source_commit: string | null;
            codebase_dir: string;
            summary: string;
            overview: string;
            app_type: "win32" | "web" | "terminal" | "mobile" | "desktop" | "macos" | "game";
            framework: string;
        } | {
            status: "invalid";
            error: {
                code: string;
                message: string;
                details: unknown;
            } | {
                code: string;
                message: string;
                details?: undefined;
            };
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        };
        setup_task: {
            progress_source: "last_reported";
            skill: "generate-illustrated-article" | "detect-project" | "suggest-sections" | "recommend-articles";
            status: "running" | "failed" | "cancelled" | "completed";
            started_at: string;
            finished_at?: string | undefined;
            total?: number | undefined;
            completed?: number | undefined;
            failed?: number | undefined;
        } | null;
        generation_ready: boolean;
    } | {
        status: string;
        project_id: string;
        instructions: string;
        workspace: string;
        api_origin: string;
        dev_mode: boolean;
        credentials_configured: boolean;
        article_run: {
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
        } | null;
        analysis: {
            status: "required";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "invalid";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "ready";
            completed_at: string;
            skills_version: string;
            output_dir: string;
            source_commit: string | null;
            codebase_dir: string;
            summary: string;
            overview: string;
            app_type: "win32" | "web" | "terminal" | "mobile" | "desktop" | "macos" | "game";
            framework: string;
        } | {
            status: "invalid";
            error: {
                code: string;
                message: string;
                details: unknown;
            } | {
                code: string;
                message: string;
                details?: undefined;
            };
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        };
        setup_task: {
            progress_source: "last_reported";
            skill: "generate-illustrated-article" | "detect-project" | "suggest-sections" | "recommend-articles";
            status: "running" | "failed" | "cancelled" | "completed";
            started_at: string;
            finished_at?: string | undefined;
            total?: number | undefined;
            completed?: number | undefined;
            failed?: number | undefined;
        } | null;
        generation_ready: boolean;
    } | {
        instructions?: string | undefined;
        status: string;
        project_id: string;
        project: {
            id: string;
            name: string;
            help_centre_url?: string | undefined;
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
        };
        repository_connection: {
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
        hosted_operation: {
            operation_id: string;
            open_when_ready: boolean;
            instructions: string;
            id: string;
            project_id: string;
            action: string;
            execution: "hosted";
            attempt: number;
            status: "queued" | "running" | "succeeded" | "failed";
            article_id: string | null;
            result: Record<string, unknown>;
            error: {
                code: string;
                message: string;
            } | null;
            review_url: string | null;
            created_at: string;
            started_at: string | null;
            finished_at: string | null;
            walkthrough_id?: string | null | undefined;
        } | undefined;
        generation_ready: boolean;
        writer_action: {
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
        } | undefined;
        workspace: string;
        api_origin: string;
        dev_mode: boolean;
        credentials_configured: boolean;
        article_run: {
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
        } | null;
        analysis: {
            status: "required";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "invalid";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "ready";
            completed_at: string;
            skills_version: string;
            output_dir: string;
            source_commit: string | null;
            codebase_dir: string;
            summary: string;
            overview: string;
            app_type: "win32" | "web" | "terminal" | "mobile" | "desktop" | "macos" | "game";
            framework: string;
        } | {
            status: "invalid";
            error: {
                code: string;
                message: string;
                details: unknown;
            } | {
                code: string;
                message: string;
                details?: undefined;
            };
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        };
        setup_task: {
            progress_source: "last_reported";
            skill: "generate-illustrated-article" | "detect-project" | "suggest-sections" | "recommend-articles";
            status: "running" | "failed" | "cancelled" | "completed";
            started_at: string;
            finished_at?: string | undefined;
            total?: number | undefined;
            completed?: number | undefined;
            failed?: number | undefined;
        } | null;
    } | {
        status: string;
        error: {
            code: string;
            message: string;
            details: unknown;
        } | {
            code: string;
            message: string;
            details?: undefined;
        };
        instructions: string;
        workspace: string;
        api_origin: string;
        dev_mode: boolean;
        credentials_configured: boolean;
        article_run: {
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
        } | null;
        analysis: {
            status: "required";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "invalid";
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        } | {
            status: "ready";
            completed_at: string;
            skills_version: string;
            output_dir: string;
            source_commit: string | null;
            codebase_dir: string;
            summary: string;
            overview: string;
            app_type: "win32" | "web" | "terminal" | "mobile" | "desktop" | "macos" | "game";
            framework: string;
        } | {
            status: "invalid";
            error: {
                code: string;
                message: string;
                details: unknown;
            } | {
                code: string;
                message: string;
                details?: undefined;
            };
            completed_at?: undefined;
            skills_version?: undefined;
            output_dir?: undefined;
            source_commit?: undefined;
            codebase_dir?: undefined;
            summary?: undefined;
            overview?: undefined;
            app_type?: undefined;
            framework?: undefined;
        };
        setup_task: {
            progress_source: "last_reported";
            skill: "generate-illustrated-article" | "detect-project" | "suggest-sections" | "recommend-articles";
            status: "running" | "failed" | "cancelled" | "completed";
            started_at: string;
            finished_at?: string | undefined;
            total?: number | undefined;
            completed?: number | undefined;
            failed?: number | undefined;
        } | null;
        generation_ready: boolean;
    }>;
    createProject(name: string, subdomain: string): Promise<unknown>;
    bind(projectId: string, options?: {
        requireIdle?: boolean;
    }): Promise<{
        project: {
            name: string;
            id?: string | undefined;
            help_centre_url?: string | undefined;
        };
        version: 1;
        project_id: string;
        api_origin: string;
    }>;
    context(): Promise<{
        project: {
            name: string;
            id?: string | undefined;
            help_centre_url?: string | undefined;
        };
        supported_bundle_versions: number[];
        sections: {
            id: string;
            name: string;
            slug: string;
            description?: string | null | undefined;
            icon?: string | null | undefined;
        }[];
        articles: {
            id: string;
            title: string;
            section_id: string | null;
        }[];
        inventory_truncated: boolean;
        local?: boolean | undefined;
        article_sync?: boolean | undefined;
        walkthrough_sync?: boolean | undefined;
        article_capacity?: {
            used: number;
            limit: number | null;
            can_create: boolean;
            upgrade_url: string;
            manage_articles_url: string;
        } | undefined;
        progressive_articles?: boolean | undefined;
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
        product_context?: Record<string, string | string[] | null> | undefined;
        project_overview?: string | null | undefined;
        analysis_summary?: string | null | undefined;
        writing_style?: string | undefined;
    }>;
    /** Recover a confirmed link from local journals without requiring a working API. */
    articleErrorContext(input: {
        run_id?: unknown;
        title?: unknown;
        artifact_dir?: unknown;
    }): Promise<{
        recovery: string;
        editor_url: string | null;
        link_message: string;
        link_instructions: string;
        run_id: string;
        title: string | undefined;
        phase: "published" | "failed" | "prepared" | "cancelled" | "interrupted" | "writing" | "finalizing" | "uploading" | "upload_failed" | "ready_for_review" | "saved" | undefined;
    } | undefined>;
    prepare(input: {
        title: string;
        description?: string;
        article_type: z.infer<typeof articleType>;
        section_id?: string;
        prefer_background?: boolean;
        open_when_ready?: boolean;
        allow_duplicate?: boolean;
    }): Promise<{
        prefer_background: boolean;
        open_when_ready: boolean;
        task_brief: {
            name: string;
            claude_model: string | null;
            codex_model: string | null;
            codex_reasoning_effort: string | null;
            prefer_background: boolean;
            reporting_instructions: string;
            writer_instructions: string;
            workspace: string;
            run_id: `${string}-${string}-${string}-${string}-${string}`;
            artifact_dir: string;
            environment: {
                RTFM_WORKSPACE: string;
                RTFM_CONTEXT_FILE: string;
                RTFM_OUTPUT_DIR: string;
                RTFM_SKILLS_DIR: string;
                RTFM_MAX_IMAGES: string;
                PATH: string;
            };
            entrypoint: {
                command: string;
                args: string[];
                shell_command: string;
                execution: {
                    command: string;
                    args: string[];
                    shell_command: string;
                    instruction: string;
                };
                completion: {
                    command: string;
                    args: string[];
                    shell_command: string;
                    instruction: string;
                };
                instruction: string;
            };
            execution: {
                command: string;
                args: string[];
                shell_command: string;
                instruction: string;
            };
            completion: {
                command: string;
                args: string[];
                shell_command: string;
                instruction: string;
            };
            editor_url: string | null;
            instructions: string[];
        };
        instructions: string[];
        writer_entrypoint: {
            command: string;
            args: string[];
            shell_command: string;
            execution: {
                command: string;
                args: string[];
                shell_command: string;
                instruction: string;
            };
            completion: {
                command: string;
                args: string[];
                shell_command: string;
                instruction: string;
            };
            instruction: string;
        };
        local?: boolean | undefined;
        saved_to?: string | undefined;
        link_message: string;
        link_instructions: string;
        editor_url: string | null;
        status: string;
        run_id: `${string}-${string}-${string}-${string}-${string}`;
        artifact_dir: string;
        environment: {
            RTFM_WORKSPACE: string;
            RTFM_CONTEXT_FILE: string;
            RTFM_OUTPUT_DIR: string;
            RTFM_SKILLS_DIR: string;
            RTFM_MAX_IMAGES: string;
            PATH: string;
        };
    }>;
    updateRun(input: {
        run_id: string;
        event: 'started' | 'failed' | 'interrupted' | 'cancelled';
        execution_mode?: 'foreground' | 'background';
        host_task_id?: string;
        stopped?: boolean;
    }): Promise<{
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
    cancel(runId: string, stopped?: boolean, expectedRun?: Run): Promise<{
        note: string;
        editor_url: string | null;
        link_message: string;
        link_instructions: string;
        status: string;
    }>;
    validate(dir: string): Promise<{
        valid: boolean;
        title: string;
        blocks: number;
        images: number;
        warnings: string[];
        finalized: boolean;
    }>;
    preview(dir: string): Promise<{
        path: string;
        uri: string;
        title: string;
        warnings: string[];
    }>;
    finalize(input: {
        artifact_dir: string;
        completed: true;
        run_id?: string;
        section_id?: string;
    }): Promise<{
        warnings: string[];
        remote: {
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
        };
        uploaded_bundle_hash: string | undefined;
        local_article_id: string;
        artifact_dir: string;
        bundle_dir: string;
        bundle_hash: string;
        project_id?: string | undefined;
        api_origin?: string | undefined;
        status: string;
    } | {
        warnings: string[];
        remote: {
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
        };
        local_article_id: string;
        artifact_dir: string;
        bundle_dir: string;
        bundle_hash: string;
        project_id?: string | undefined;
        api_origin?: string | undefined;
        status: string;
    } | {
        warnings: string[];
        local_article_id: string;
        artifact_dir: string;
        bundle_dir: string;
        bundle_hash: string;
        project_id?: string | undefined;
        api_origin?: string | undefined;
        status: string;
    }>;
    private finalizeUnlocked;
    /** Saved local articles, newest first: state files without a help centre plus their run titles. */
    localArticles(): Promise<{
        slug: string;
        title: string;
        local_article_id: string;
        artifact_dir: string;
        export_path?: string;
        run_id?: string;
    }[]>;
    listLocal(): Promise<{
        status: "local";
        source: "local";
        articles: {
            slug: string;
            title: string;
            artifact_dir: string;
            article_path?: string;
            export_path?: string;
            local_article_id?: string;
            run_id?: string;
        }[];
        next_cursor: null;
        searched_directories: string[];
        warnings: {
            path: string;
            message: string;
        }[];
        instructions: string;
    } | {
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
        articles: {
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
        }[];
        status: "unsupported";
        project: {
            name: string;
            id?: string | undefined;
            help_centre_url?: string | undefined;
        };
        instructions: string;
    }>;
    upload(slug: string): Promise<{
        import_id: string;
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
        };
    }>;
    /** Shared CLI/MCP saved-article upload; the lock keeps the destination stable for the batch. */
    uploadLocalArticles(slugs?: string[], onEvent?: (event: {
        slug: string;
        title: string;
        editor_url?: string;
        error?: ReturnType<typeof publicError>;
    }) => void): Promise<{
        status: string;
        project_id: string;
        articles: {
            slug: string;
            title: string;
            local_article_id: string;
            artifact_dir: string;
            export_path?: string;
            run_id?: string;
        }[];
        instructions: string;
        uploaded?: undefined;
        already_uploaded?: undefined;
        failed?: undefined;
        skipped?: undefined;
    } | {
        status: string;
        project_id: string;
        uploaded: {
            slug: string;
            title: string;
            editor_url: string;
        }[];
        already_uploaded: {
            slug: string;
            editor_url: string;
        }[];
        failed: {
            slug: string;
            title: string;
            error: ReturnType<typeof publicError>;
        }[];
        skipped: string[];
        instructions: string;
        articles?: undefined;
    }>;
    private uploadUnlocked;
    complete(input: {
        run_id: string;
        completed: true;
    }, options?: {
        deliver?: boolean;
    }): Promise<{
        instructions: string[];
        hosting_invitation?: {
            id: string;
            message: string;
        } | undefined;
        show_to_user?: string | undefined;
        local: boolean;
        editor_url: string | null;
        link_message: string;
        link_instructions: string;
        status: "saved";
        run_id: string;
        slug: string;
        artifact_dir: string;
        markdown_path: string;
        export_dir: string;
        image_count: number | undefined;
        preview_uri: string | undefined;
    } | {
        open_when_ready: boolean;
        instructions: string[];
        repository_invitation?: {
            id: string;
            message: string;
            connect_url: string;
        } | undefined;
        show_to_user?: string | undefined;
        status: string;
        run_id: string;
        slug: string | undefined;
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
        };
        editor_url: string;
        repository_connection: {
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
    } | {
        status: string;
        editor_url: string;
    }>;
    /** A run written without a help centre is finalized and exported instead of uploaded. Safe to repeat. */
    private completeLocallyUnlocked;
    private savedLocally;
    private delivery;
    private reportProgressEvent;
    retryArticle(input: {
        run_id: string;
        stopped: true;
    }): Promise<{
        task_brief: {
            name: string;
            claude_model: string | null;
            codex_model: string | null;
            codex_reasoning_effort: string | null;
            prefer_background: boolean | undefined;
            reporting_instructions: string;
            run_id: string;
            entrypoint: {
                command: string;
                args: string[];
                shell_command: string;
                execution: {
                    command: string;
                    args: string[];
                    shell_command: string;
                    instruction: string;
                };
                completion: {
                    command: string;
                    args: string[];
                    shell_command: string;
                    instruction: string;
                };
                instruction: string;
            };
            execution: {
                command: string;
                args: string[];
                shell_command: string;
                instruction: string;
            };
            completion: {
                command: string;
                args: string[];
                shell_command: string;
                instruction: string;
            };
            editor_url: string | null;
            writer_instructions: string;
            workspace: string;
            artifact_dir: string;
            environment: {
                RTFM_WORKSPACE: string;
                RTFM_CONTEXT_FILE: string;
                RTFM_OUTPUT_DIR: string;
                RTFM_SKILLS_DIR: string;
                RTFM_MAX_IMAGES: string;
                PATH: string;
            };
            instructions: string[];
        };
        instructions: string;
        local?: boolean | undefined;
        link_instructions: string;
        prefer_background: boolean | undefined;
        editor_url: string | null;
        link_message: string;
        run_id: string;
    }>;
    get hosted(): HostedOperations;
    createArticle(input: {
        title?: string;
        recommendation_id?: string;
        description?: string;
        article_type: z.infer<typeof articleType>;
        publish?: boolean;
        request_id?: string;
        prefer_background?: boolean;
        open_when_ready?: boolean;
    }): Promise<{
        operation_id: string;
        open_when_ready: boolean;
        instructions: string;
        id: string;
        project_id: string;
        action: string;
        execution: "hosted";
        attempt: number;
        status: "queued" | "running" | "succeeded" | "failed";
        article_id: string | null;
        result: Record<string, unknown>;
        error: {
            code: string;
            message: string;
        } | null;
        review_url: string | null;
        created_at: string;
        started_at: string | null;
        finished_at: string | null;
        walkthrough_id?: string | null | undefined;
    } | {
        publication_requested: boolean;
        prefer_background: boolean;
        open_when_ready: boolean;
        task_brief: {
            name: string;
            claude_model: string | null;
            codex_model: string | null;
            codex_reasoning_effort: string | null;
            prefer_background: boolean;
            reporting_instructions: string;
            writer_instructions: string;
            workspace: string;
            run_id: `${string}-${string}-${string}-${string}-${string}`;
            artifact_dir: string;
            environment: {
                RTFM_WORKSPACE: string;
                RTFM_CONTEXT_FILE: string;
                RTFM_OUTPUT_DIR: string;
                RTFM_SKILLS_DIR: string;
                RTFM_MAX_IMAGES: string;
                PATH: string;
            };
            entrypoint: {
                command: string;
                args: string[];
                shell_command: string;
                execution: {
                    command: string;
                    args: string[];
                    shell_command: string;
                    instruction: string;
                };
                completion: {
                    command: string;
                    args: string[];
                    shell_command: string;
                    instruction: string;
                };
                instruction: string;
            };
            execution: {
                command: string;
                args: string[];
                shell_command: string;
                instruction: string;
            };
            completion: {
                command: string;
                args: string[];
                shell_command: string;
                instruction: string;
            };
            editor_url: string | null;
            instructions: string[];
        };
        instructions: string[];
        writer_entrypoint: {
            command: string;
            args: string[];
            shell_command: string;
            execution: {
                command: string;
                args: string[];
                shell_command: string;
                instruction: string;
            };
            completion: {
                command: string;
                args: string[];
                shell_command: string;
                instruction: string;
            };
            instruction: string;
        };
        local?: boolean | undefined;
        saved_to?: string | undefined;
        link_message: string;
        link_instructions: string;
        editor_url: string | null;
        status: string;
        run_id: `${string}-${string}-${string}-${string}-${string}`;
        artifact_dir: string;
        environment: {
            RTFM_WORKSPACE: string;
            RTFM_CONTEXT_FILE: string;
            RTFM_OUTPUT_DIR: string;
            RTFM_SKILLS_DIR: string;
            RTFM_MAX_IMAGES: string;
            PATH: string;
        };
    }>;
    editArticle(input: {
        article_id: string;
        expected_revision: string;
        instructions: string;
        request_id?: string;
        prefer_background?: boolean;
        open_when_ready?: boolean;
    }): Promise<{
        operation_id: string;
        open_when_ready: boolean;
        instructions: string;
        id: string;
        project_id: string;
        action: string;
        execution: "hosted";
        attempt: number;
        status: "queued" | "running" | "succeeded" | "failed";
        article_id: string | null;
        result: Record<string, unknown>;
        error: {
            code: string;
            message: string;
        } | null;
        review_url: string | null;
        created_at: string;
        started_at: string | null;
        finished_at: string | null;
        walkthrough_id?: string | null | undefined;
    } | {
        status: string;
        execution: string;
        article: {
            [x: string]: unknown;
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
        };
        editing_instructions: string;
        next_tool: string;
        expected_revision: string;
        instructions: string;
    }>;
    createWalkthrough(input: {
        article_id?: string;
        expected_revision?: string;
        request_id?: string;
        prefer_background?: boolean;
        open_when_ready?: boolean;
    }): Promise<{
        operation_id: string;
        open_when_ready: boolean;
        instructions: string;
        id: string;
        project_id: string;
        action: string;
        execution: "hosted";
        attempt: number;
        status: "queued" | "running" | "succeeded" | "failed";
        article_id: string | null;
        result: Record<string, unknown>;
        error: {
            code: string;
            message: string;
        } | null;
        review_url: string | null;
        created_at: string;
        started_at: string | null;
        finished_at: string | null;
        walkthrough_id?: string | null | undefined;
    } | {
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
        instructions?: undefined;
    } | {
        status: string;
        instructions: string;
    }>;
    listSuggestions(kind: 'sections' | 'recommendations', afterId?: string): Promise<{
        kind: "sections" | "recommendations";
        items: ({
            id: string;
            name: string;
            slug: string;
            description: string | null;
            justification: string | null;
            status: "pending" | "accepted" | "rejected";
            visible: boolean;
        } | {
            id: string;
            section_id: string | null;
            title: string;
            description: string | null;
            justification: string | null;
            article_type: "how-to" | "troubleshooting" | "concept" | "faq";
            status: "pending" | "accepted" | "rejected" | "generated";
            article_id: string | null;
        })[];
        next_cursor: string | null;
    }>;
    reviewSuggestion(kind: 'sections' | 'recommendations', id: string, decision: 'accept' | 'reject'): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        justification: string | null;
        status: "pending" | "accepted" | "rejected";
        visible: boolean;
    } | {
        id: string;
        section_id: string | null;
        title: string;
        description: string | null;
        justification: string | null;
        article_type: "how-to" | "troubleshooting" | "concept" | "faq";
        status: "pending" | "accepted" | "rejected" | "generated";
        article_id: string | null;
    }>;
    listArticles(afterId?: string, source?: 'auto' | 'local' | 'hosted'): Promise<{
        status: "local";
        source: "local";
        articles: {
            slug: string;
            title: string;
            artifact_dir: string;
            article_path?: string;
            export_path?: string;
            local_article_id?: string;
            run_id?: string;
        }[];
        next_cursor: null;
        searched_directories: string[];
        warnings: {
            path: string;
            message: string;
        }[];
        instructions: string;
    } | {
        articles: {
            [x: string]: unknown;
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
        }[];
        next_cursor: string | null;
    }>;
    mutateArticle(action: 'update_article' | 'publish_article' | 'unpublish_article' | 'delete_article', input: {
        article_id: string;
        expected_revision: string;
        structured_content?: unknown;
        body?: string;
        title?: string;
    }): Promise<{
        [x: string]: unknown;
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
    } | {
        id: string;
        deleted_at: string;
    }>;
    getArticle(articleId: string): Promise<{
        [x: string]: unknown;
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
    }>;
    publish(slug: string, expectedRevision: string): Promise<{
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
    }>;
}
