import { z } from 'zod';
export declare const idSchema: z.ZodString;
export declare const remoteId: z.ZodString;
export declare const articleType: z.ZodEnum<{
    "how-to": "how-to";
    troubleshooting: "troubleshooting";
    concept: "concept";
    faq: "faq";
}>;
export declare const articleSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<2>;
    title: z.ZodString;
    article_type: z.ZodEnum<{
        "how-to": "how-to";
        troubleshooting: "troubleshooting";
        concept: "concept";
        faq: "faq";
    }>;
    blocks: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"prose">;
        presentation: z.ZodEnum<{
            lead: "lead";
            body: "body";
            summary: "summary";
        }>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        content: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        type: z.ZodLiteral<"section">;
        presentation: z.ZodEnum<{
            numbered: "numbered";
            plain: "plain";
        }>;
        title: z.ZodString;
        content: z.ZodString;
        has_image: z.ZodBoolean;
        id: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        type: z.ZodLiteral<"list">;
        presentation: z.ZodEnum<{
            bullets: "bullets";
            checklist: "checklist";
            tips: "tips";
        }>;
        title: z.ZodString;
        items: z.ZodArray<z.ZodString>;
        id: z.ZodString;
    }, z.core.$strict>], "type">>;
}, z.core.$strict>;
export type Article = z.infer<typeof articleSchema>;
export declare const manifestSchema: z.ZodObject<{
    bundle_version: z.ZodLiteral<1>;
    local_article_id: z.ZodUUID;
    run_id: z.ZodUUID;
    skills_version: z.ZodString;
    source_commit: z.ZodNullable<z.ZodString>;
    source_dirty: z.ZodBoolean;
    section_id: z.ZodNullable<z.ZodString>;
    article_sha256: z.ZodString;
    images: z.ZodArray<z.ZodObject<{
        block_id: z.ZodString;
        filename: z.ZodString;
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime_type: z.ZodLiteral<"image/png">;
    }, z.core.$strict>>;
    bundle_hash: z.ZodString;
}, z.core.$strict>;
export type Manifest = z.infer<typeof manifestSchema>;
export declare const bindingSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    project_id: z.ZodString;
    api_origin: z.ZodURL;
}, z.core.$strict>;
export type Binding = z.infer<typeof bindingSchema>;
/** A workspace that saves finished articles locally instead of (or before) uploading them. */
export declare const localSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    export_dir: z.ZodString;
    writing_style: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodObject<{
        prefer_background: z.ZodBoolean;
        open_when_ready: z.ZodBoolean;
    }, z.core.$strip>>;
}, z.core.$strict>;
export type LocalSettings = z.infer<typeof localSchema>;
export declare const repositoryConnectionSchema: z.ZodObject<{
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
}, z.core.$strip>;
export declare const remoteArticleSchema: z.ZodObject<{
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
export declare const importResponseSchema: z.ZodObject<{
    import_id: z.ZodString;
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
export declare const articleCapacitySchema: z.ZodObject<{
    used: z.ZodNumber;
    limit: z.ZodNullable<z.ZodNumber>;
    can_create: z.ZodBoolean;
    upgrade_url: z.ZodURL;
    manage_articles_url: z.ZodURL;
}, z.core.$strip>;
export declare const contextSchema: z.ZodObject<{
    local: z.ZodOptional<z.ZodBoolean>;
    article_sync: z.ZodOptional<z.ZodBoolean>;
    walkthrough_sync: z.ZodOptional<z.ZodBoolean>;
    article_capacity: z.ZodOptional<z.ZodObject<{
        used: z.ZodNumber;
        limit: z.ZodNullable<z.ZodNumber>;
        can_create: z.ZodBoolean;
        upgrade_url: z.ZodURL;
        manage_articles_url: z.ZodURL;
    }, z.core.$strip>>;
    progressive_articles: z.ZodOptional<z.ZodBoolean>;
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
    project: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        help_centre_url: z.ZodOptional<z.ZodURL>;
    }, z.core.$strip>;
    supported_bundle_versions: z.ZodArray<z.ZodNumber>;
    sections: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        icon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    articles: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        section_id: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>>;
    product_context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodNull]>>>;
    inventory_truncated: z.ZodDefault<z.ZodBoolean>;
    project_overview: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    analysis_summary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    writing_style: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
