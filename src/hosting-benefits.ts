import path from 'node:path';
import { z } from 'zod';
import { ReminderJournal, claimDelivery, defaultConfigDir, reminderStateSchema, selectBenefit, takeAccepted, type ReminderState } from './reminders.js';
import { track } from './telemetry.js';

export const hostingInvitationSchema = z.object({ id: z.string(), message: z.string() });
export type HostingInvitation = z.infer<typeof hostingInvitationSchema>;

/** Why an anonymous local folder would want a SupportPages.io account. Every
 * message must hold on the free plan a new account lands on. */
export const hostingBenefits = [
  { id: 'keep_up_to_date', category: 'maintenance', message: 'If you connect WTFM to a free SupportPages.io account, you can keep this article up to date automatically.' },
  { id: 'public_url', category: 'reach', short: 'a public URL to share with customers', message: 'Give this article a public URL on your own SupportPages.io help centre, ready to share with customers.' },
  { id: 'editor_review', category: 'editing', short: 'an editor to polish drafts before anyone sees them', message: 'Review and polish drafts in the SupportPages.io editor, with your screenshots already in place, before anyone else sees them.' },
  { id: 'ai_answers', category: 'reach', short: 'AI answers for the questions customers ask', message: 'Let customers ask questions on your help centre and get AI answers grounded in your articles.' },
  { id: 'agent_publishing', category: 'editing', message: 'Publish, unpublish and update hosted articles straight from your coding agent, with revision-safe saves that never overwrite browser edits.' },
  { id: 'free_account', category: 'usage', short: 'hosts up to 10 articles and leaves your local files exactly where they are', message: 'A free SupportPages.io account hosts up to 10 articles, and your local files stay exactly where they are.' },
  { id: 'one_help_centre', category: 'organisation', message: 'Keep every article together in one help centre organised into sections, instead of scattered Markdown files.' },
  { id: 'next_step_repository', category: 'hosted', message: 'Once hosted, connect your repository and let SupportPages.io suggest, generate and maintain articles in the background.' },
] as const;

/** The invitation shown before a folder has chosen where its articles go,
 * composed from the same catalogue the post-article reminders draw on so a user
 * cannot be promised one thing at setup and another afterwards. Hosting is an
 * offer here, never a requirement: saving articles locally needs no account. */
const shortForm = (id: string) => {
  const benefit = hostingBenefits.find(item => item.id === id);
  const short = benefit && 'short' in benefit ? benefit.short : undefined;
  if (!short) throw new Error(`Hosting benefit ${id} has no short form for the setup invitation.`);
  return short;
};
export const setupInvitation = () => [
  `Linking a free SupportPages.io help centre also gives each article ${shortForm('public_url')}, ${shortForm('editor_review')} and ${shortForm('ai_answers')}.`,
  `A free account ${shortForm('free_account')}.`,
];

/** The exact paragraph the agent shows after a saved local article: the benefit, then the
 * question. A device that is not signed in is offered a free account; a signed-in one, its own. */
export const hostingShowText = (invitation: HostingInvitation, signedIn = false) =>
  `${invitation.message} ${signedIn ? 'Would you like me to connect it to your SupportPages.io account?' : 'Would you like me to create your free account?'}`;

/** Anonymous users have no context yet: every one of the first three local
 * completions carries a benefit, then every third completion after that. */
export const hostingReminderDue = (count: number) => count <= 3 || (count - 3) % 3 === 0;

const stateSchema = reminderStateSchema(hostingInvitationSchema);
type State = ReminderState<HostingInvitation>;

/** Device-local preference and deduplication for a whole API origin: an anonymous
 * folder has no help centre to key on, so every local folder on this computer shares it. */
export class HostingReminders {
  private journal: ReminderJournal<HostingInvitation>;
  constructor(configDir = defaultConfigDir()) {
    this.journal = new ReminderJournal(path.join(configDir, 'hosting-reminders'), stateSchema);
  }
  private transaction<T>(origin: string, operation: (state: State) => T) {
    return this.journal.transaction([new URL(origin).origin, 'local'], operation);
  }
  preference(origin: string, enabled?: boolean) {
    return this.transaction(origin, state => {
      if (enabled !== undefined) {
        state.enabled = enabled;
        track('nudge_preference', { nudge: 'hosting', enabled: enabled ? 'on' : 'off' });
      }
      return { enabled: state.enabled, api_origin: origin, scope: 'local_folders_on_this_device' };
    });
  }
  /** A local folder on this device just moved to a help centre: counts the
   * latest invitation as taken up when it was recent (takeAccepted). */
  accepted(origin: string) {
    return this.transaction(origin, state => {
      const taken = takeAccepted(state);
      if (taken) track('nudge_accepted', { nudge: 'hosting', benefit: taken.id, completions: taken.completions });
      return taken?.id;
    });
  }
  complete(input: { origin: string; articleId: string }) {
    return this.transaction(input.origin, state => {
      if (!claimDelivery(state, input.articleId)) return;
      if (!state.enabled || !hostingReminderDue(state.count)) return;
      const benefit = selectBenefit(state, hostingBenefits);
      const invitation = { id: benefit.id, message: benefit.message };
      state.articles[input.articleId] = invitation;
      // completions: which local article it followed (the 1st, 2nd, 3rd, 6th...).
      track('nudge_shown', { nudge: 'hosting', benefit: benefit.id, completions: state.count });
      return invitation;
    });
  }
}
