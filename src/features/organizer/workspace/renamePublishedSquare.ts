import { supabase } from '../../../../services/supabase';

/**
 * Renames one square on a published board through the audited server path.
 * Direct writes to board_data are rejected by the publish trigger, so this
 * RPC is the only route — it logs the change in the board's history.
 */
export async function renamePublishedSquare(poolId: string, cellIndex: number, nextName: string): Promise<void> {
  const { error } = await supabase.rpc('gridone_rename_published_square', {
    p_contest_id: poolId,
    p_cell_index: cellIndex,
    p_new_name: nextName,
  });
  if (error) throw new Error(error.message || 'Unknown error');
}
