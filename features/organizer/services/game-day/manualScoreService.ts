import { supabase } from '../../../../services/supabase';
import type { GameState, LiveGameData } from '../../../../types';
import { EMPTY_MANUAL_SCORES, manualPeriodForState } from '../../game-day/manualScoringModel';

const requireToken = async (message: string) => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error(message);
  return token;
};

const parseJson = async (response: Response) => {
  try { return await response.json(); } catch { return {}; }
};

export const enableManualScoringOnServer = async (poolId: string) => {
  const token = await requireToken('Sign in before changing score authority.');
  const response = await fetch(`/api/pools/${poolId}/score/manual`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await parseJson(response);
  if (!response.ok) throw new Error(result.error || 'Manual scoring could not be enabled.');
  return result;
};

export const saveManualScoreToServer = async (poolId: string, game: GameState) => {
  const token = await requireToken('Sign in before saving the score.');
  const body = {
    quarterScores: game.manualQuarterScores ?? EMPTY_MANUAL_SCORES,
    period: manualPeriodForState(
      game.manualGameState ?? 'in',
      game.manualPeriod,
      game.manualQuarterScores,
    ),
    state: game.manualGameState ?? 'in',
  };
  const response = await fetch(`/api/pools/${poolId}/score/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const result = await parseJson(response) as { error?: string; score?: LiveGameData };
  if (!response.ok) throw new Error(result.error || 'Unable to save the score.');
  return result;
};

export const returnAutomaticScoringOnServer = async (poolId: string) => {
  const token = await requireToken('Sign in before changing score authority.');
  const response = await fetch(`/api/pools/${poolId}/score/manual`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await parseJson(response);
  if (!response.ok) throw new Error(result.error || 'Automatic scoring could not be enabled.');
  return result;
};
