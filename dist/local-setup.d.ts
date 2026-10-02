import { z } from 'zod';
import { Workspace } from './workspace.js';
export declare const sectionProposal: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
    icon: z.ZodDefault<z.ZodString>;
    justification: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const recommendation: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    previous_titles: z.ZodDefault<z.ZodArray<z.ZodString>>;
    justification: z.ZodDefault<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<{
        "how-to": "how-to";
        troubleshooting: "troubleshooting";
        concept: "concept";
        faq: "faq";
    }>>;
    section_id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    section_slug: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        dismissed: "dismissed";
        completed: "completed";
    }>>;
}, z.core.$strip>;
export declare const planSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    project_id: z.ZodString;
    sections: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        slug: z.ZodString;
        description: z.ZodDefault<z.ZodString>;
        icon: z.ZodDefault<z.ZodString>;
        justification: z.ZodOptional<z.ZodString>;
        id: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    sections_generated: z.ZodDefault<z.ZodBoolean>;
    section_suggestions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        slug: z.ZodString;
        description: z.ZodDefault<z.ZodString>;
        icon: z.ZodDefault<z.ZodString>;
        justification: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    dismissed_section_slugs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    recommendations: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        previous_titles: z.ZodDefault<z.ZodArray<z.ZodString>>;
        justification: z.ZodDefault<z.ZodString>;
        type: z.ZodDefault<z.ZodEnum<{
            "how-to": "how-to";
            troubleshooting: "troubleshooting";
            concept: "concept";
            faq: "faq";
        }>>;
        section_id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        section_slug: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        status: z.ZodDefault<z.ZodEnum<{
            pending: "pending";
            dismissed: "dismissed";
            completed: "completed";
        }>>;
    }, z.core.$strip>>>;
    recommendations_generated: z.ZodDefault<z.ZodBoolean>;
    feature_inventory: z.ZodDefault<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type LocalPlan = z.infer<typeof planSchema>;
export declare const cacheFiles: string[];
export declare function projectCacheFiles(codebaseDir?: string): string[];
/** detect-project names the app type an incomplete map needs; that is the recovery hint. */
export declare function requiredAppType(block?: string | null): string | undefined;
/** Shared by the CLI and MCP: a successful agent message is not a readiness check. */
export declare class LocalSetup {
    ws: Workspace;
    root: string;
    constructor(ws: Workspace, root: string);
    validate(outputDir: string, codebaseDir?: string): Promise<{
        codebase_dir: string;
        branding: {
            [x: string]: unknown;
            framework: string;
        };
        map: {
            [x: string]: unknown;
            framework: string;
            app_type: "win32" | "web" | "terminal" | "mobile" | "desktop" | "macos" | "game";
            route_index: Record<string, unknown> | unknown[];
            dir_map?: Record<string, unknown> | undefined;
        };
        detection: {
            [x: string]: unknown;
            detection_status?: string | undefined;
            detection_block?: string | null | undefined;
            app_type_source?: string | undefined;
        };
        hashes: Record<string, string>;
        summary: string;
        overview: string;
    }>;
    accept(outputDir: string, agent: string, skillsVersion: string, sourceCommit?: string | null, codebaseDir?: string): Promise<{
        codebase_dir: string;
        branding: {
            [x: string]: unknown;
            framework: string;
        };
        map: {
            [x: string]: unknown;
            framework: string;
            app_type: "win32" | "web" | "terminal" | "mobile" | "desktop" | "macos" | "game";
            route_index: Record<string, unknown> | unknown[];
            dir_map?: Record<string, unknown> | undefined;
        };
        detection: {
            [x: string]: unknown;
            detection_status?: string | undefined;
            detection_block?: string | null | undefined;
            app_type_source?: string | undefined;
        };
        hashes: Record<string, string>;
        summary: string;
        overview: string;
    }>;
    analysis(): Promise<{
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
    }>;
    requireAnalysis(): Promise<{
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
    }>;
    progress(): Promise<{
        progress_source: "last_reported";
        skill: "generate-illustrated-article" | "detect-project" | "suggest-sections" | "recommend-articles";
        status: "running" | "failed" | "cancelled" | "completed";
        started_at: string;
        finished_at?: string | undefined;
        total?: number | undefined;
        completed?: number | undefined;
        failed?: number | undefined;
    } | null>;
    plan(projectId: string): Promise<LocalPlan>;
    savePlan(plan: LocalPlan): Promise<void>;
}
