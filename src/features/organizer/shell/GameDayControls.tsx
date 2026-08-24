import React from 'react';
import type { GameState, LiveGameData, NotificationDeliveryIssue, PayoutDescriptions } from '../../../../types';
import { ManualScoringPanel } from '../game-day/ManualScoringPanel';
import type { ManualGameState, ManualQuarterKey, ManualScoreSide } from '../game-day/manualScoringModel';

export default function GameDayControls({
  game,
  liveData,
  shareCode,
  issues,
  payoutSaveStatus,
  scoreSaveStatus,
  onOpenViewer,
  onUpdatePayoutDescription,
  onSavePayoutDescriptions,
  onEnableAutomaticScoring,
  onEnableManualScoring,
  onUpdateManualGameState,
  onUpdateManualPeriod,
  onUpdateManualQuarter,
  onSaveManualScore,
  disabled,
  isActivated,
}: {
  game: GameState;
  liveData: LiveGameData | null;
  shareCode: string | null;
  issues: NotificationDeliveryIssue[];
  payoutSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  scoreSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onOpenViewer?: () => void;
  onUpdatePayoutDescription: (field: keyof PayoutDescriptions, value: string) => void;
  onSavePayoutDescriptions: () => void;
  onEnableAutomaticScoring: () => void;
  onEnableManualScoring: () => void;
  onUpdateManualGameState: (state: ManualGameState) => void;
  onUpdateManualPeriod: (period: number) => void;
  onUpdateManualQuarter: (quarter: ManualQuarterKey, side: ManualScoreSide, value: number) => void;
  onSaveManualScore: () => void;
  disabled: boolean;
  isActivated: boolean;
}) {
  const payoutDescriptions = game.payoutDescriptions || {};
  return (
    <section role="region" aria-label="Game day" className="grid gap-4 border border-ink p-4">
      <h2 className="text-2xl font-semibold">Game day</h2>
      <p>Score authority: {game.useManualScores || liveData?.isManual ? 'Manual scoring authority' : 'Automatic scoring authority'}.</p>
      {shareCode && onOpenViewer ? (
        <button type="button" className="oa-btn oa-btn-primary justify-self-start" onClick={onOpenViewer}>Open public board</button>
      ) : (
        <p>The public board link will appear after the board is published.</p>
      )}
      <div className="grid gap-2 border border-newsprint p-3" role="group" aria-label="Prize notes">
        <h3 className="text-lg font-semibold">Prize notes</h3>
        {(['Q1', 'HALF', 'Q3', 'FINAL', 'notes'] as const).map((field) => (
          <label key={field} className="grid gap-1 text-sm">
            <span>{field === 'notes' ? 'Prize notes' : `${field} prize`}</span>
            <input className="oa-input" value={payoutDescriptions[field] || ''} onChange={(event) => onUpdatePayoutDescription(field, event.target.value)} disabled={disabled || payoutSaveStatus === 'saving'} />
          </label>
        ))}
        <button type="button" className="oa-btn oa-btn-primary justify-self-start" onClick={onSavePayoutDescriptions} disabled={disabled || payoutSaveStatus === 'saving'} aria-busy={payoutSaveStatus === 'saving'}>
          {payoutSaveStatus === 'saving' ? 'Saving prize notes…' : 'Save prize notes'}
        </button>
      </div>
      <div className="border border-newsprint p-3">
        <ManualScoringPanel
          isActivated={isActivated}
          game={game}
          scoreSaveStatus={scoreSaveStatus}
          onEnableAutomaticScoring={onEnableAutomaticScoring}
          onEnableManualScoring={onEnableManualScoring}
          onUpdateManualGameState={onUpdateManualGameState}
          onUpdateManualPeriod={onUpdateManualPeriod}
          onUpdateManualQuarter={onUpdateManualQuarter}
          onSaveManualScore={onSaveManualScore}
        />
      </div>
      {issues.length ? <p role="status">Review delivery issue</p> : <p>No delivery issues.</p>}
    </section>
  );
}
