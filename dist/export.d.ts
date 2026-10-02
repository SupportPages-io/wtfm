import { Workspace } from './workspace.js';
import type { Snapshot } from './artifacts.js';
export declare const markdownFilename = "index.md";
/** Portable Markdown for docs folders: headings per block, images referenced beside the file. */
export declare function renderMarkdown(snap: Snapshot): string;
/** Write `<exportDir>/<slug>/index.md` plus the screenshots it references. Re-exports replace stale files. */
export declare function exportArticle(ws: Workspace, snap: Snapshot, artifactDir: string, exportDir: string, slug: string): Promise<{
    markdown_path: string;
    export_dir: string;
    image_count: number;
}>;
