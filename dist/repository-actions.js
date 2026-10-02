import { resolveAction } from './actions.js';
/** Preserve the requested action through account, permission and repository setup. */
export async function repositoryAction(bridge, action, feature = 'article_gaps') {
    const requested = action === 'connect_repository' ? feature === 'video_walkthrough' ? 'create_video_walkthrough' : 'find_article_gaps' : action;
    const decision = await resolveAction(bridge, requested);
    return { status: decision.allowed ? 'available' : 'action_required', ...decision,
        instructions: 'Show the action-specific next step and preserve the requested action. The user must approve browser consent. Retry the original action after setup; do not start local analysis or generation.' };
}
//# sourceMappingURL=repository-actions.js.map