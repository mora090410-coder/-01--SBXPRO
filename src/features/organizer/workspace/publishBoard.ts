import { supabase } from '../../../../services/supabase';

export type PublishResult =
  | { published: true; shareCode: string; viewerUrl: string; revision: number; tier: string; used: number; allowance: number }
  | { published: false; upgradeTo: 'gameday' | 'org'; message: string };

/** Publishes a board's viewer link. Mirrors `components/AdminPanel.tsx`'s publish call. */
export async function publishBoard(poolId: string, options: { allowOpenSquares: boolean }): Promise<PublishResult> {
  const { data } = await supabase.auth.getSession();
  const response = await fetch(`/api/pools/${poolId}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    },
    body: JSON.stringify(options.allowOpenSquares ? { allowOpenSquares: true } : {}),
  });
  const result = await response.json().catch(() => ({}));

  if (response.status === 402 && (result.upgradeTo === 'gameday' || result.upgradeTo === 'org')) {
    return { published: false, upgradeTo: result.upgradeTo, message: result.error };
  }
  if (!response.ok) throw new Error(result.error || 'The board could not be published.');

  return {
    published: true,
    shareCode: result.shareCode,
    viewerUrl: result.viewerUrl,
    revision: result.revision,
    tier: result.tier,
    used: result.used,
    allowance: result.allowance,
  };
}
