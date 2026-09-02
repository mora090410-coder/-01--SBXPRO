import React from 'react';
import { Eyebrow, Glass, Numeral } from '../../../../design/primitives';
import type { GameState, LiveGameData } from '../../../../../types';
import { ManualScoringPanel } from '../../game-day/ManualScoringPanel';
import type { ManualGameState, ManualQuarterKey, ManualScoreSide } from '../../game-day/manualScoringModel';

export interface ScoreAuthorityCardProps {
  game: GameState;
  liveData: LiveGameData | null;
  scoreSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  isActivated: boolean;
  onEnableAutomaticScoring: () => void;
  onEnableManualScoring: () => void;
  onUpdateManualGameState: (state: ManualGameState) => void;
  onUpdateManualPeriod: (period: number) => void;
  onUpdateManualQuarter: (quarter: ManualQuarterKey, side: ManualScoreSide, value: number) => void;
  onSaveManualScore: () => void;
}

export default function ScoreAuthorityCard({
  game,
  liveData,
  scoreSaveStatus,
  isActivated,
  onEnableAutomaticScoring,
  onEnableManualScoring,
  onUpdateManualGameState,
  onUpdateManualPeriod,
  onUpdateManualQuarter,
  onSaveManualScore,
}: ScoreAuthorityCardProps) {
  const isManual = game.useManualScores || liveData?.isManual;
  return (
    <Glass padding="lg" className="flex flex-col gap-4">
      <Eyebrow>Score authority</Eyebrow>
      <p className="font-ui text-[15px] text-fg-2">
        {isManual ? 'Manual scoring authority' : 'Automatic scoring authority'}
      </p>
      {liveData && (
        <Numeral
          value={`${liveData.leftScore} – ${liveData.topScore}`}
          secondary={`${game.leftAbbr} at ${game.topAbbr}`}
          size="md"
          label={`${game.leftAbbr} ${liveData.leftScore}, ${game.topAbbr} ${liveData.topScore}`}
        />
      )}
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
    </Glass>
  );
}
