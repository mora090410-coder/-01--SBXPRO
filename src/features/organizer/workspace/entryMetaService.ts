import { supabase } from '../../../../services/supabase';
import type { EntryMeta } from '../../../../types';

/** Upserts a square's private metadata (paid status, seller, contact) for a pool. */
export async function saveEntryMeta(poolId: string, meta: EntryMeta): Promise<void> {
  const { error } = await supabase
    .from('contest_entries')
    .upsert({
      contest_id: poolId,
      cell_index: meta.cell_index,
      paid_status: meta.paid_status === null ? undefined : meta.paid_status,
      notify_opt_in: meta.notify_opt_in,
      contact_type: meta.contact_type || null,
      contact_value: meta.contact_value || null,
      seller_label: meta.seller_label?.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'contest_id, cell_index' });

  if (error) throw new Error(error.message);
}

/** Clears all entry metadata for a pool (used when the board is reset). */
export async function clearEntryMeta(poolId: string): Promise<void> {
  const { error } = await supabase
    .from('contest_entries')
    .delete()
    .eq('contest_id', poolId);

  if (error) throw new Error(error.message);
}
