import { z } from 'zod';
import type { Bridge } from './bridge.js';
import { contextSchema } from './schema.js';
export declare const walkthroughSchema: z.ZodObject<{
    id: z.ZodString;
    project_id: z.ZodString;
    article_id: z.ZodString;
    title: z.ZodString;
    slug: z.ZodString;
    revision: z.ZodString;
    generation_status: z.ZodEnum<{
        running: "running";
        failed: "failed";
        pending: "pending";
        completed: "completed";
    }>;
    ready: z.ZodBoolean;
    narrated: z.ZodBoolean;
    publication_pending: z.ZodBoolean;
    shared: z.ZodBoolean;
    public_on_article: z.ZodBoolean;
    review_url: z.ZodURL;
    playback_url: z.ZodNullable<z.ZodURL>;
    public_url: z.ZodNullable<z.ZodURL>;
    article_public_url: z.ZodNullable<z.ZodURL>;
    assets: z.ZodObject<{
        video: z.ZodBoolean;
        narrated_video: z.ZodBoolean;
        subtitles: z.ZodBoolean;
        transcript: z.ZodBoolean;
        poster: z.ZodBoolean;
    }, z.core.$strip>;
    created_at: z.ZodISODateTime;
    updated_at: z.ZodISODateTime;
    generated_at: z.ZodNullable<z.ZodISODateTime>;
    shared_at: z.ZodNullable<z.ZodISODateTime>;
    error: z.ZodNullable<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>>;
    transcript_text: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    transcript_omitted: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
type Context = z.infer<typeof contextSchema>;
export declare class Walkthroughs {
    private bridge;
    constructor(bridge: Bridge);
    private supported;
    private check;
    list(input?: {
        after_id?: string;
        through_id?: string;
        article_id?: string;
    }, context?: Context): Promise<{
        project_id: string;
        through_id: string;
        next_cursor: string | null;
        walkthroughs: {
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
        }[];
    }>;
    get(id: string): Promise<{
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
    }>;
    refresh(context: Context, previous?: unknown): Promise<{
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
    }>;
}
export {};
