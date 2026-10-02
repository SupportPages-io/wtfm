import type { Bridge } from './bridge.js';
/** Inspect current article files, without syncing, signing in or changing setup. */
export declare function localArticleInventory(bridge: Bridge): Promise<{
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
}>;
