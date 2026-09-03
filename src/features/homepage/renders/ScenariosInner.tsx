import React from 'react';
import type { LiveGameData } from '../../../../types';
import ScenarioDisclosure from '../../viewer/scenarios/ScenarioDisclosure';
import { buildScenarioModel } from '../../viewer/scenarios/scenarioModel';
import { demoBoard, demoGame, demoLive, demoWinnerNow } from '../demoData';

const noop = () => {};
const live = demoLive as LiveGameData;

/**
 * The name on the first demo square a next score would reach. Derived, so the moment can never
 * claim a match the board does not have: the current winner holds the square the score is on now,
 * so their squares are by definition not the ones the next scores land on.
 */
const holder = buildScenarioModel({ board: demoBoard, game: demoGame, live })
  .scenarios.flatMap((scenario) => scenario.names)
  .find((name) => name && name !== 'OPEN') ?? demoWinnerNow;

/** The real next-score list, with the demo board and the holder whose squares those scores reach. */
export default function ScenariosInner() {
  return (
    <ScenarioDisclosure
      board={demoBoard}
      game={demoGame}
      live={live}
      selectedPlayer={holder}
      servicesEnabled
      onScenarioFocus={noop}
    />
  );
}
