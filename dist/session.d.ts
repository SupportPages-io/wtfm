import { type WriterAction } from './actions.js';
import { Workspace } from './workspace.js';
import { Bridge } from './bridge.js';
import { type Account } from './credentials.js';
import { type Approval, type PairingRuntime } from './pairing.js';
import { publicError } from './errors.js';
export declare function credentialLocation(origin: string, configDir: string): {
    reference: string;
    filename: string;
};
export declare const defaultConfigDir: () => string;
/** Bounded display label for the approval page; never a path. */
export declare function deviceLabel(hostname?: string): string;
export type LoginResult = {
    status: 'signed_in';
    api_origin: string;
    account?: Account;
    already_signed_in?: boolean;
};
export type FormSchema = {
    type: 'object';
    properties: Record<string, {
        type: 'string';
        title?: string;
        description?: string;
        enum?: string[];
        enumNames?: string[];
        default?: string;
        minLength?: number;
        maxLength?: number;
    }>;
    required?: string[];
};
export type AccountOffer = {
    status: 'unavailable';
} | {
    status: 'declined';
    asked: boolean;
} | {
    status: 'linked';
    project_id: string;
    account?: Account;
} | ({
    status: string;
} & Record<string, unknown>);
export type HostedSetupInput = {
    workspace?: string;
    project_id?: string;
    signup?: boolean;
    action: 'find_article_gaps' | 'suggest_sections' | 'recommend_articles' | 'create_video_walkthrough';
    article_id?: string;
    resume_arguments?: {
        article_id?: string;
        expected_revision?: string;
        request_id?: string;
        prefer_background?: boolean;
        open_when_ready?: boolean;
    };
};
export declare class Session {
    options: {
        workspace?: string;
        projectDir?: string;
        cwd: string;
        origin: string;
        dev: boolean;
        skillsDir: string;
        configDir: string;
        tokenFile?: string;
        token?: string;
        pairingRuntime?: PairingRuntime;
        callBudgetMs?: number;
    };
    roots?: () => Promise<string[] | undefined>;
    private selected?;
    private pairings;
    private initializing;
    private hostedConnecting;
    private setupPages;
    openBrowser: (url: string) => Promise<boolean>;
    approval?: (request: Approval) => Promise<'accept' | 'decline' | 'cancel' | 'unsupported'>;
    approvalCompleted?: (id: string) => Promise<void>;
    /** Form elicitation: the client renders the question itself, so the choice never
     * depends on how the model phrases it. Undefined when the client has no dialog. */
    askForm?: (message: string, requestedSchema: FormSchema) => Promise<{
        action: 'accept' | 'decline' | 'cancel';
        content?: Record<string, unknown>;
    } | undefined>;
    private declinedAccount;
    private bridges;
    private closed;
    close(): void;
    constructor(options: {
        workspace?: string;
        projectDir?: string;
        cwd: string;
        origin: string;
        dev: boolean;
        skillsDir: string;
        configDir: string;
        tokenFile?: string;
        token?: string;
        pairingRuntime?: PairingRuntime;
        callBudgetMs?: number;
    });
    workspace(requested?: string): Promise<Workspace>;
    /** Explicit token overrides win; otherwise the device credential for this origin; otherwise an inherited environment token. */
    private credential;
    account(): Promise<Account | undefined>;
    bridge(ws?: Workspace, options?: {
        resumeCompletion?: boolean;
    }): Promise<Bridge>;
    /** Sign this device in. Reuses a working credential; otherwise runs browser approval and saves the delivered account token. */
    login(input?: {
        publish?: boolean;
        scopes?: ('publish' | 'manage' | 'generate')[];
        onApproval?: (request: Approval) => Promise<void>;
    }): Promise<LoginResult>;
    /** A new request never expands the existing token. Only the explicit browser
     * grant can deliver a replacement credential. Declining keeps the old one. */
    requestPermissions(input: {
        workspace?: string;
        action: WriterAction;
        article_id?: string;
        scopes: ('publish' | 'manage' | 'generate')[];
    }): Promise<{
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
    } | {
        requested_action: "read_articles" | "create_article" | "update_article" | "edit_article" | "publish_article" | "unpublish_article" | "delete_article" | "find_article_gaps" | "suggest_sections" | "recommend_articles" | "review_sections" | "review_recommendations" | "create_video_walkthrough" | "get_operation" | "generate_help_centre";
        status: string;
        verification_uri: string | undefined;
        user_code: string | undefined;
        expires_at: string;
        instructions: string;
    }>;
    saveCredential(delivery: {
        token: string;
        account?: Account;
    }): Promise<void>;
    /** Active setup for an explicitly requested hosted action. Inspection tools
     * never call this: opening setup is not approval and never starts a job. */
    setupHosted(input: HostedSetupInput): Promise<Record<string, unknown>>;
    /** Ask, in the client's own dialog, whether to sign in before a hosted request
     * the device cannot serve; then sign in, choose the help centre and link this
     * folder, all through dialogs. Declining is remembered for this session so the
     * user is not asked again unless they raise it. */
    offerAccount(ws: Workspace, input: {
        need: string;
        explicit?: boolean;
    }): Promise<AccountOffer>;
    private linkAfterSignIn;
    private openSetupPage;
    private hostedSetup;
    /** CLI-only: move this folder to another help centre after the user confirmed it. The device credential is untouched. */
    switchProject(ws: Workspace, expectedProjectId: string, projectId: string): Promise<{
        archive: string;
        restored_history: boolean;
    }>;
    logout(): Promise<{
        status: string;
        api_origin: string;
    } | {
        already_logged_out: boolean;
        status: string;
        api_origin: string;
    }>;
    status(input?: {
        workspace?: string;
        run_id?: string;
    }): Promise<{
        status: string;
        instructions: string;
        verification_uri: string | undefined;
        user_code: string | undefined;
        expires_at: string;
        workspace: string;
        api_origin: string;
        dev_mode: boolean;
        account: Account | undefined;
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
        account: Account | undefined;
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
    } | {
        status: string;
        instructions: string;
        workspace: string;
        api_origin: string;
        dev_mode: boolean;
        account: Account | undefined;
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
    } | {
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
        account: Account | undefined;
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
        account: Account | undefined;
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
        account: Account | undefined;
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
        account: Account | undefined;
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
        account: Account | undefined;
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
        account: Account | undefined;
    }>;
    private authentication;
    init(input: {
        workspace?: string;
        project_id?: string;
        signup?: boolean;
        host_local?: boolean;
    }): Promise<unknown>;
    /** MCP equivalent of the CLI's publish flow. Each response names the next user choice. */
    publish(input?: {
        workspace?: string;
        project_id?: string;
        slugs?: string[];
        signup?: boolean;
    }): Promise<{
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
    } | {
        status: string;
        uploaded: never[];
        instructions: string;
        articles?: undefined;
    } | {
        status: string;
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
    }>;
    private connect;
    private initWorkspace;
    private initialize;
}
