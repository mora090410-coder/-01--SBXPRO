import React from 'react';
import type { WinnerResolution } from '../../../types';
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
    <section role="region" aria-label="Correction flow" className="grid gap-3 border border-newsprint p-4">
      <h2 className="text-xl font-semibold">Corrections and final record</h2>
      <p>Use an audited public correction for published labels or resolved milestones. Private payment/seller metadata stays private.</p>
      <div className="grid gap-2 border border-newsprint p-3">
        <h3 className="text-lg font-semibold">Milestone correction</h3>
        <label className="grid gap-1 text-sm">
          <span>Resolved milestone</span>
          <select className="oa-input" value={draft?.milestone || ''} disabled={pending || !winnerHistory.length} onChange={(event) => {
            const milestone = event.target.value as WinnerResolution['milestone'];
            const current = winnerHistory.find((w) => w.milestone === milestone);
            onDraftChange?.(current ? { milestone, expectedVersion: current.resolutionVersion ?? 1, sideScore: current.sideScore ?? 0, topScore: current.topScore ?? 0, reason: '' } : null);
          }}>
            <option value="">Select milestone</option>
            {winnerHistory.map((w) => <option key={w.milestone} value={w.milestone}>{w.milestone} rev {w.resolutionVersion ?? 1}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Correct side score</span>
          <input className="oa-input" type="number" min={0} value={draft?.sideScore ?? 0} disabled={!draft || pending} onChange={(event) => draft && onDraftChange?.({ ...draft, sideScore: Math.max(0, Number(event.target.value) || 0) })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Correct top score</span>
          <input className="oa-input" type="number" min={0} value={draft?.topScore ?? 0} disabled={!draft || pending} onChange={(event) => draft && onDraftChange?.({ ...draft, topScore: Math.max(0, Number(event.target.value) || 0) })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Public audit reason</span>
          <textarea className="oa-input" value={draft?.reason || ''} disabled={!draft || pending} onChange={(event) => draft && onDraftChange?.({ ...draft, reason: event.target.value })} />
        </label>
        {selected && <p>Expected revision {draft?.expectedVersion}; current public winner {selected.participantName || 'OPEN'}.</p>}
        <button type="button" className="oa-btn oa-btn-primary justify-self-start" disabled={!canPublish} aria-busy={pending} onClick={onPublishCorrection}>
          {pending ? 'Publishing correction…' : 'Publish audited correction'}
        </button>
      </div>
      <div className="grid gap-2" aria-label="Final Record read-only durable history">
        <h3 className="text-lg font-semibold">Final Record</h3>
        {winnerHistory.length ? <ul>{winnerHistory.map((w) => <li key={`${w.milestone}-${w.resolvedAt}`}>{w.milestone}: {w.participantName || 'OPEN'} rev {w.resolutionVersion ?? 1}{w.corrected ? ` corrected: ${w.correctionReason || 'audited'}` : ''}</li>)}</ul> : <p>No resolved milestones yet.</p>}
      </div>
    </section>
  );
}
