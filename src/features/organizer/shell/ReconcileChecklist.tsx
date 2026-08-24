import React from 'react';
import type { OrganizerLifecycleModel } from '../lifecycle/organizerLifecycle';
const advisoryText: Record<string,string> = { open_squares_remaining: 'OPEN squares remain. You can publish if you are okay leaving them OPEN.', unpaid_or_unknown_payment_status: 'Some private payment notes still need follow-up.', seller_attribution_gaps: 'Some seller notes still need follow-up.' };
const blockerText: Record<string,string> = {
  missing_owner: 'The board owner could not be verified. Reload and try again.',
  missing_board_identity: 'Add a board title before publishing.',
  missing_scheduled_game: 'Choose the scheduled game before publishing.',
  invalid_board_shape: 'This board could not be checked. Reload and try again.',
  duplicate_or_ambiguous_public_identity: 'Make each public name unique so families can find the right squares.',
  open_square_acknowledgement_required: 'Confirm that the remaining OPEN squares should stay OPEN.',
  invalid_committed_axes: 'Draw one complete set of numbers before publishing.',
  dynamic_axes_not_supported: 'This older board uses changing number sets and cannot be published in this version.',
  save_dirty: 'Save the latest changes before publishing.',
  save_saving: 'Wait for the board to finish saving.',
  save_save_failed: 'The latest changes did not save. Reload or try again.',
  save_conflicted: 'This board changed in another session. Reload the latest version.',
  save_recovered: 'Review and save the recovered draft before publishing.',
};
export default function ReconcileChecklist({ model }: { model: OrganizerLifecycleModel }) {
  return <section aria-label="Check before publishing" className="grid gap-4 md:grid-cols-2"><div role="region" aria-label="Before you can publish" className="border border-ink p-4"><h2 className="font-semibold">Before you can publish</h2>{model.hardBlockers.length ? <ul>{model.hardBlockers.map((b) => <li key={b}>{blockerText[b] || 'Review this board before publishing.'}</li>)}</ul> : <p>Nothing blocking publish.</p>}</div><div role="region" aria-label="Private follow-up" className="border border-newsprint p-4"><h2 className="font-semibold">Private follow-up</h2>{model.advisories.length ? <ul>{model.advisories.map((a) => <li key={a}>{advisoryText[a] || 'Review this private note.'}</li>)}</ul> : <p>No private follow-up.</p>}</div></section>;
}
