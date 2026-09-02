import { describe, expect, it } from 'vitest';
import type { GameState, ScheduledGame } from '../../types';
import { applyScheduledGame } from '../../src/features/organizer/workspace/applyScheduledGame';

const scheduled: ScheduledGame = {
  id: '401000001',
  kickoffAt: '2026-09-10T00:20:00.000Z',
  state: 'pre',
  season: 2026,
  week: 1,
  awayTeam: { abbr: 'DAL', name: 'Dallas Cowboys' },
  homeTeam: { abbr: 'WAS', name: 'Washington Commanders' },
};

const baseGame = (): GameState => ({
  title: 'Lincoln Boosters Board',
  meta: '',
  gameExternalId: 'evt-old',
  kickoffAt: '2026-09-13T17:00:00.000Z',
  leftAbbr: 'KC',
  leftName: 'Kansas City',
  topAbbr: 'PHI',
  topName: 'Philadelphia',
  dates: '2026-09-13',
  lockTitle: false,
  lockMeta: false,
  payoutDescriptions: { Q1: 'Bragging rights' },
});

describe('applyScheduledGame', () => {
  it('maps the away team to the left axis and the home team to the top axis', () => {
    const next = applyScheduledGame(baseGame(), scheduled);

    expect(next.leftAbbr).toBe('DAL');
    expect(next.leftName).toBe('Dallas Cowboys');
    expect(next.topAbbr).toBe('WAS');
    expect(next.topName).toBe('Washington Commanders');
  });

  it('carries the provider identity and derives the legacy date from the kickoff', () => {
    const next = applyScheduledGame(baseGame(), scheduled);

    expect(next.gameExternalId).toBe('401000001');
    expect(next.kickoffAt).toBe('2026-09-10T00:20:00.000Z');
    expect(next.dates).toBe('2026-09-10');
  });

  it('keeps every field the picker does not own', () => {
    const next = applyScheduledGame(baseGame(), scheduled);

    expect(next.title).toBe('Lincoln Boosters Board');
    expect(next.payoutDescriptions).toEqual({ Q1: 'Bragging rights' });
  });

  it('clears the score state the previous matchup left behind', () => {
    const stale: GameState = {
      ...baseGame(),
      scoreSnapshot: { state: 'in', leftScore: 14, topScore: 7, isManual: true } as any,
      useManualScores: true,
      manualQuarterScores: { Q1: { left: 7, top: 0 } } as any,
      manualLeftScore: 14,
      manualTopScore: 7,
      manualPeriod: 2,
      manualGameState: 'in',
    };

    const next = applyScheduledGame(stale, scheduled);

    expect(next.scoreSnapshot).toBeNull();
    expect(next.useManualScores).toBe(false);
    expect(next.manualQuarterScores).toBeUndefined();
    expect(next.manualLeftScore).toBe(0);
    expect(next.manualTopScore).toBe(0);
    expect(next.manualPeriod).toBeUndefined();
    expect(next.manualGameState).toBeUndefined();
  });

  it('does not mutate the game it was given', () => {
    const game = baseGame();
    applyScheduledGame(game, scheduled);

    expect(game.leftAbbr).toBe('KC');
    expect(game.gameExternalId).toBe('evt-old');
  });
});
