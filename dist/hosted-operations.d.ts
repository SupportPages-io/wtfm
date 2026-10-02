import { z } from 'zod';
import type { Bridge } from './bridge.js';
import { type WriterAction, type ActionDecision } from './actions.js';
export declare const operationSchema: z.ZodObject<{
    id: z.ZodString;
    project_id: z.ZodString;
    action: z.ZodString;
    execution: z.ZodLiteral<"hosted">;
    attempt: z.ZodNumber;
    status: z.ZodEnum<{
        queued: "queued";
        running: "running";
        succeeded: "succeeded";
        failed: "failed";
    }>;
    article_id: z.ZodNullable<z.ZodString>;
    walkthrough_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    result: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    error: z.ZodNullable<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>>;
    review_url: z.ZodNullable<z.ZodURL>;
    created_at: z.ZodISODateTime;
    started_at: z.ZodNullable<z.ZodISODateTime>;
    finished_at: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strip>;
/** Durable request identity is written before any submission. Status can recover
 * a lost response by key without creating another job, even after a restart. */
export declare class HostedOperations {
    private bridge;
    constructor(bridge: Bridge);
    private path;
    private check;
    submit(action: WriterAction, input: Record<string, unknown>, options?: {
        request_id?: string;
        prefer_background?: boolean;
        open_when_ready?: boolean;
        decision?: ActionDecision;
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
    }>;
    get(id?: string, waitMs?: number, allowOpen?: boolean): Promise<{
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
    } | undefined>;
    private poll;
    retry(id: string, attempt: number): Promise<{
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
    }>;
    private present;
}
