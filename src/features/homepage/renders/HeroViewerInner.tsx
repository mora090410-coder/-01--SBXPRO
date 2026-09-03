import React from 'react';
import type { LiveGameData } from '../../../../types';
import { calculateWinnerHighlights } from '../../../../utils/winnerLogic';
import ViewerShell from '../../viewer/shell/ViewerShell';
import { demoBoard, demoGame, demoLive, demoWinnerNow } from '../demoData';

const live = demoLive as LiveGameData;
const highlights = calculateWinnerHighlights(live);
const noop = () => {};

/** The real game-day view with the demo board. Static props only: it never loads anything. */
export default function HeroViewerInner() {
  return (
    <ViewerShell
      game={demoGame}
      board={demoBoard}
      live={live}
      liveStatus="live"
      isSynced
      highlights={highlights}
      winnerHistory={[]}
      pendingMilestones={[]}
      selectedPlayer={demoWinnerNow}
      onClearPlayer={noop}
      onFindSquares={noop}
      highlightedCoords={null}
      onScenarioFocus={noop}
      organizerPreview
      servicesEnabled
    />
  );
}
