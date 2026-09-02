import type { GameState, ScheduledGame } from '../../../../types';

/**
 * Fold a picked provider game into the workspace draft.
 *
 * The axis mapping matches board creation exactly (`pages/CreateContest.tsx`
 * `handleGameChange`): ESPN's away team is the board's left axis, home is the
 * top axis. Changing the matchup also invalidates every score fact the old
 * matchup left behind, so the manual/snapshot score state resets with it --
 * the same reset the pre-workspace admin panel performed.
 */
export const applyScheduledGame = (game: GameState, scheduled: ScheduledGame): GameState => ({
  ...game,
  gameExternalId: scheduled.id,
  kickoffAt: scheduled.kickoffAt,
  // ESPN's away team is the board's left axis; home is the top axis.
  leftAbbr: scheduled.awayTeam.abbr,
  leftName: scheduled.awayTeam.name,
  topAbbr: scheduled.homeTeam.abbr,
  topName: scheduled.homeTeam.name,
  // Legacy read compatibility only. The provider kickoff remains canonical.
  dates: scheduled.kickoffAt.slice(0, 10),
  scoreSnapshot: null,
  useManualScores: false,
  manualQuarterScores: undefined,
  manualLeftScore: 0,
  manualTopScore: 0,
  manualPeriod: undefined,
  manualGameState: undefined,
});

export default applyScheduledGame;
