import { z } from 'zod';
import { type Article, type Manifest } from './schema.js';
import { Workspace } from './workspace.js';
export declare const sha256: (data: string | Buffer) => string;
export declare function canonical(value: unknown): string;
export declare function parse<T>(schema: z.ZodType<T>, value: unknown, code?: string): T;
export type Snapshot = {
    article: Article;
    articleBytes: Buffer;
    images: {
        block_id: string;
        filename: string;
        bytes: Buffer;
    }[];
    warnings: string[];
};
/** Read the latest usable preview without requiring finished screenshots or lint. */
export declare function progressSnapshot(ws: Workspace, dir: string, options?: {
    imageHashes?: Record<string, string>;
    fallbackDir?: string;
}): Promise<Snapshot | undefined>;
export declare function snapshot(ws: Workspace, dir: string, startedAt?: string): Promise<Snapshot>;
export declare function createManifest(snap: Snapshot, metadata: Pick<Manifest, 'local_article_id' | 'run_id' | 'skills_version' | 'source_commit' | 'source_dirty' | 'section_id'>): Manifest;
export declare function verifyBundle(ws: Workspace, dir: string): Promise<{
    manifest: {
        bundle_version: 1;
        local_article_id: string;
        run_id: string;
        skills_version: string;
        source_commit: string | null;
        source_dirty: boolean;
        section_id: string | null;
        article_sha256: string;
        images: {
            block_id: string;
            filename: string;
            sha256: string;
            size: number;
            mime_type: "image/png";
        }[];
        bundle_hash: string;
    };
    snap: Snapshot;
}>;
export declare function preview(snap: Snapshot): string;
