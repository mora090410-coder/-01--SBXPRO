import React from 'react';
import type { WinnerResolution } from '../../../../types';
import type { MilestoneCorrectionDraft } from '../services/corrections/milestoneCorrectionService';

export default function CorrectionFlow({
  winnerHistory,
  draft,
  pending = false,
  onDraftChange,
  onPublishCorrection,
}: {
  winnerHistory: WinnerResolution[];
  draft?: MilestoneCorrectionDraft | null;
  pending?: boolean;
  onDraftChange?: (draft: MilestoneCorrectionDraft | null) => void;
  onPublishCorrection?: () => void;
}) {
  const selected = draft?.milestone ? winnerHistory.find((w) => w.milestone === draft.milestone) : null;
  const canPublish = Boolean(draft && draft.reason.trim() && !pending);
  return (
    <section role="region" aria-label="Corrections and final record" className="grid gap-3 border border-newsprint p-4">
      <h2 className="text-xl font-semibold">Corrections and final record</h2>
      <p>Correct a published result here. Everyone who opens the board will see the change and the reason. Private payment and seller notes stay private.</p>
      <div className="grid gap-2 border border-newsprint p-3">
        <h3 className="text-lg font-semibold">Correct a published result</h3>
        <label className="grid gap-1 text-sm">
          <span>Result to correct</span>
          <select className="oa-input" value={draft?.milestone || ''} disabled={pending || !winnerHistory.length} onChange={(event) => {
            const milestone = event.target.value as WinnerResolution['milestone'];
            const current = winnerHistory.find((w) => w.milestone === milestone);
            onDraftChange?.(current ? { milestone, expectedVersion: current.resolutionVersion ?? 1, sideScore: current.sideScore ?? 0, topScore: current.topScore ?? 0, reason: '' } : null);
          }}>
            <option value="">Select a result</option>
            {winnerHistory.map((w) => <option key={w.milestone} value={w.milestone}>{w.milestone}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Side score</span>
          <input className="oa-input" type="number" min={0} value={draft?.sideScore ?? 0} disabled={!draft || pending} onChange={(event) => draft && onDraftChange?.({ ...draft, sideScore: Math.max(0, Number(event.target.value) || 0) })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Top score</span>
          <input className="oa-input" type="number" min={0} value={draft?.topScore ?? 0} disabled={!draft || pending} onChange={(event) => draft && onDraftChange?.({ ...draft, topScore: Math.max(0, Number(event.target.value) || 0) })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Why this changed (shown publicly)</span>
          <textarea className="oa-input" value={draft?.reason || ''} disabled={!draft || pending} onChange={(event) => draft && onDraftChange?.({ ...draft, reason: event.target.value })} />
        </label>
        {selected && <p>Current winner: {selected.participantName || 'OPEN'}.</p>}
        <button type="button" className="oa-btn oa-btn-primary justify-self-start" disabled={!canPublish} aria-busy={pending} onClick={onPublishCorrection}>
          {pending ? 'Publishing correction…' : 'Publish correction'}
        </button>
      </div>
      <div className="grid gap-2" aria-label="Final record">
        <h3 className="text-lg font-semibold">Final Record</h3>
        {winnerHistory.length ? <ul>{winnerHistory.map((w) => <li key={`${w.milestone}-${w.resolvedAt}`}>{w.milestone}: {w.participantName || 'OPEN'}{w.corrected ? ` — corrected: ${w.correctionReason || 'reason recorded'}` : ''}</li>)}</ul> : <p>No results recorded yet.</p>}
      </div>
    </section>
  );
}
