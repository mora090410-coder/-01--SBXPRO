import React from 'react';
import type { BoardData, GameState, LiveGameData } from '../../../../types';
import { Island, Ring } from '../../../design/primitives';
import { buildViewerScoreModel } from '../score/viewerScoreModel';

export interface ViewerIslandProps {
  game: GameState;
  board: BoardData;
  live: LiveGameData | null;
  liveStatus: string;
  isSynced: boolean;
  selectedPlayer: string;
  yourSquares: number;
  winsNow: boolean;
}

/** Pinned score capsule. Mirrors the score instrument so the score stays in view while the board scrolls. */
const ViewerIsland: React.FC<ViewerIslandProps> = ({ game, live, liveStatus, isSynced, selectedPlayer, yourSquares, winsNow }) => {
  if (!live) return null;
  const score = buildViewerScoreModel({ live, liveStatus, isSynced });
  const stale = live.freshness === 'stale' || live.freshness === 'offline' || live.freshness === 'refreshing';
  const leftLabel = game.leftAbbr || 'AWAY';
  const topLabel = game.topAbbr || 'HOME';

  return (
    <Island
      label="Score"
      placement="top"
      collapsed={(
        <span className="flex items-center gap-3 whitespace-nowrap font-mono tabular-nums text-[14px] text-broadcast-white">
          <span>{leftLabel} {live.leftScore}</span>
          <span className="text-broadcast-white/40">·</span>
          <span>{topLabel} {live.topScore}</span>
          <span className="text-broadcast-white/40">·</span>
          <span className={live.state === 'in' ? 'text-tone-live' : 'text-broadcast-white/70'}>{score.periodLabel}</span>
          {selectedPlayer ? (
            <Ring value={Math.min(1, yourSquares / 100)} label={`${yourSquares} squares for ${selectedPlayer}`} caption={String(yourSquares)} tone={winsNow ? 'gold' : 'fg'} size={24} />
          ) : null}
        </span>
      )}
      expanded={(
        <div className="flex flex-col gap-2 min-w-[260px] font-ui text-[14px] text-broadcast-white/80">
          {winsNow && selectedPlayer ? <p className="font-medium text-gold">{selectedPlayer} wins right now</p> : null}
          <p><span className="font-medium text-broadcast-white">{score.authority.label}</span> · {score.authority.detail}</p>
          <p className="font-mono text-[12px] text-broadcast-white/60">{stale ? 'Last known · ' : ''}{score.freshness || 'Checked time unavailable'} · {score.pollingText}</p>
          {live.sourceName && !score.authority.detail.includes(live.sourceName) ? (
            <p className="font-mono text-[12px] text-broadcast-white/60">Source · {live.sourceName}</p>
          ) : null}
        </div>
      )}
    />
  );
};

export default ViewerIsland;
