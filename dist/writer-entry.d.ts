/** Screenshots per locally written article. The engine treats this as a hard
 * limit (RTFM_MAX_IMAGES); each mockup costs minutes of model time. */
export declare const writerScreenshotLimit = 3;
export declare function writerEntry(workspace: string, stateRoot: string, runId: string, skillsDir: string, writerToken?: string): {
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
export declare function loadWriterInstructions(args: string[], _env?: NodeJS.ProcessEnv): Promise<string>;
/** Each command gets its own prepared environment; no shell state must survive
 * between agent tool calls. Release the state lock before running so the relay
 * can continue delivering previews. The host still owns stopping old writers. */
export declare function runWriterCommand(args: string[], command: string[], env?: NodeJS.ProcessEnv): Promise<number>;
/** Explicit writer success; no API credentials or network requests in this process. */
export declare function requestWriterCompletion(args: string[], _env?: NodeJS.ProcessEnv): Promise<{
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
export declare function finishWriter(args: string[], env: NodeJS.ProcessEnv, timeoutMs?: number): Promise<{
    status: string;
    run_id: string;
    markdown_path: string;
    instructions: string;
    editor_url?: undefined;
} | {
    status: string;
    run_id: string;
    editor_url: string;
    instructions: string;
    markdown_path?: undefined;
}>;
