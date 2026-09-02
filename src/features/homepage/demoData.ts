import type { BoardData, GameState, LiveGameData } from '../../../types';

export const demoGame: GameState = {
  title: 'Lincoln Softball Booster Board',
  meta: 'Chiefs at Eagles · Jan 18, 2026',
  organizationDisplayName: 'Lincoln Softball Boosters',
  leftAbbr: 'KC',
  leftName: 'Kansas City',
  topAbbr: 'PHI',
  topName: 'Philadelphia',
  dates: 'Jan 18, 2026',
  lockTitle: true,
  lockMeta: true,
};

export const demoLive: LiveGameData = {
  leftScore: 17,
  topScore: 14,
  quarterScores: {
    Q1: { left: 7, top: 0 },
    Q2: { left: 3, top: 7 },
    Q3: { left: 7, top: 7 },
    Q4: { left: 0, top: 0 },
    OT: { left: 0, top: 0 },
  },
  clock: '6:42',
  period: 3,
  state: 'in',
  detail: '3rd quarter',
  isOvertime: false,
  sourceName: 'Sample score',
  retrievedAt: '2026-01-18T21:18:00.000Z',
  staleAfter: '2026-01-18T21:19:00.000Z',
  freshness: 'fresh',
};

export const demoBoard: BoardData = {
  topAxis: [4, 1, 8, 6, 2, 9, 0, 5, 7, 3],
  leftAxis: [7, 2, 5, 0, 9, 4, 1, 8, 3, 6],
  allowOpenSquares: true,
  isDynamic: false,
  participants: [
    { id: 'taylor-m', displayName: 'Taylor M.', publicLabel: 'Taylor M.' },
    { id: 'ava-r', displayName: 'Ava R.', publicLabel: 'Ava R.' },
    { id: 'open', displayName: 'OPEN', publicLabel: 'OPEN' },
  ],
  squares: Array.from({ length: 100 }, (_, index) => {
    if ([0, 27, 64].includes(index)) return ['Taylor M.'];
    if ([12, 45, 88].includes(index)) return ['Ava R.'];
    if ([9, 71].includes(index)) return ['OPEN'];
    return index % 5 === 0 ? ['Booster'] : [];
  }),
};

export const DEMO_LABEL = 'Demo board — sample names and scores';

export const demoWinnerNow = 'Taylor M.';

/** Taylor M.'s squares as (left digit, top digit) pairs, derived so copy can never drift from the board. */
export const demoWinnerSquares: Array<{ left: number; top: number }> = demoBoard.squares
  .map((names, index) => ({ names, index }))
  .filter(({ names }) => names[0] === demoWinnerNow)
  .map(({ index }) => ({ left: demoBoard.leftAxis[Math.floor(index / 10)]!, top: demoBoard.topAxis[index % 10]! }));
