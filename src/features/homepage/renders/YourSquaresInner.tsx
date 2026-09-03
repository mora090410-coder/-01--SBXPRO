import React from 'react';
import type { LiveGameData } from '../../../../types';
import YourSquaresSummary from '../../viewer/personal/YourSquaresSummary';
import { demoBoard, demoGame, demoLive, demoWinnerNow } from '../demoData';

const noop = () => {};

/** The real square summary a named holder sees, with the demo board. */
export default function YourSquaresInner() {
  return (
    <YourSquaresSummary
      board={demoBoard}
      game={demoGame}
      live={demoLive as LiveGameData}
      selectedPlayer={demoWinnerNow}
      onViewSquare={noop}
    />
  );
}
