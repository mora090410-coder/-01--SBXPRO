import type { OrganizerIslandProps } from './OrganizerIsland';

/** Private organizer summaries; counts always describe squares, never people or money. */
export function buildOrganizerIslandSummary(input: OrganizerIslandProps) {
  const save = ({ clean: 'saved', conflicted: 'conflict', save_failed: 'failed' } as Record<string, string>)[input.saveStatus ?? ''] ?? input.saveStatus;
  const saveLabel = save === 'conflict' ? 'Changes need review'
    : save === 'error' || save === 'failed' ? 'Save failed'
      : save === 'saving' ? 'Saving…'
        : save === 'dirty' ? 'Changes not saved'
          : save === 'offline' ? 'Offline · changes not saved'
            : save === 'recovered' ? 'Recovered · review changes'
              : save === 'saved' ? 'Saved' : 'Local preview';
  const issue = ['conflict', 'error', 'failed', 'offline'].includes(save ?? '');
  const unpaid = input.unpaid ?? 0;
  const unknown = input.unknown ?? Math.max(0, input.filled - input.paid - unpaid);
  let label = `${input.filled} of 100 assigned`;
  let detail = saveLabel;
  const ready = Boolean(input.primary && !input.primary.disabled && !input.disabled && !input.hasBlocker && (!save || save === 'saved'));
  if (issue) {
    label = saveLabel;
    detail = save === 'conflict' ? 'Review this session’s changes' : 'Your changes need saving';
  }
  else if (input.activeTask === 'payments') label = `${input.paid} paid · ${unpaid} unpaid · ${unknown} not asked`;
  else if (input.isPublished) {
    label = input.isFinal || input.phase === 'Final Record' ? 'Final record' : input.liveSummary || 'Published board';
    detail = input.liveTrust || saveLabel;
  } else if (input.isShared && !input.drawn) label = 'Shared · numbers not drawn';
  else if (input.drawn) {
    label = 'Numbers drawn';
    if (ready) detail = 'Preview ready';
  }
  else if (input.phase === 'Draw' && ready) label = 'Ready to draw';
  return { label, detail, saveLabel, issue, unpaid, unknown };
}
