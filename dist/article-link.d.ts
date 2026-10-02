import type { Run } from './runs.js';
export declare const articleChatInstruction = "Keep user-facing chat focused on the SupportPages.io editor link, article progress, review and publication. Do not mention local assets, saved files, filesystem paths, output directories, filenames, rendering scripts or validation reports in routine progress, completion or failure messages. These are internal execution details, not deliverables to list or download. Explain failures in terms of their effect on the article and the next action, with the editor link when available. If delivery fails, say that the latest changes could not be confirmed in the editor; do not claim the editor is up to date or reassure the user that assets are saved locally. Share technical file details only when the user explicitly asks for them.";
export declare const showArticleLinkInstruction: string;
/** Local workspaces have no editor: the saved Markdown path is the deliverable. */
export declare const localChatInstruction = "This folder saves articles locally; there is no SupportPages.io editor or help centre for it. The saved Markdown path is the deliverable: show it in your completion message, with the number of screenshots. Keep progress messages concise and free of intermediate filenames, rendering scripts or validation reports. Never ask whether to publish automatically; hosting needs an account. If the user explicitly asks to host or publish saved local articles, ask whether to sign in or create a free SupportPages.io account, then use supportpages_publish. Any hosting offer comes from complete_article as hosting_invitation; do not add your own.";
export declare const localLinkInstruction: string;
export declare function articleLink(run: Run): {
    editor_url: string | null;
    link_message: string;
    link_instructions: string;
};
/** Keep the URL visible as a separate MCP text item as well as structured data. */
export declare function articleLinkContent(value: unknown): {
    type: "text";
    text: string;
}[];
