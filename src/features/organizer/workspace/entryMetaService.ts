import { supabase } from '../../../../services/supabase';
import type { EntryMeta } from '../../../../types';

/** One atomic, owner-scoped payment update. Omitted private columns are never overwritten. */
export async function savePaymentStatuses(poolId: string, indices: number[], status: EntryMeta['paid_status']): Promise<EntryMeta[]> {
  if (!poolId || !['paid', 'unpaid', 'unknown'].includes(status)) throw new Error('Invalid payment update.');
  if (indices.some(index => !Number.isInteger(index) || index < 0 || index > 99)) throw new Error('Invalid square selection.');
  const unique = [...new Set(indices)];
  if (!unique.length) return [];
  const { data, error } = await supabase.from('contest_entries').upsert(
    unique.map(cell_index => ({ contest_id: poolId, cell_index, paid_status: status })),
    { onConflict: 'contest_id, cell_index', defaultToNull: false },
  ).select('cell_index,paid_status,notify_opt_in,contact_type,contact_value,seller_label');
  if (error) throw new Error(error.message);
  const saved = (data ?? []) as EntryMeta[];
  if (saved.length !== unique.length || unique.some(index => !saved.some(row => row.cell_index === index && row.paid_status === status))) {
    throw new Error('Could not confirm all payment changes. Refresh private notes before trying again.');
  }
  return saved;
}

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

/**
 * Upserts many squares' private metadata in one round trip. Range assignment
 * writes one row per square it just labelled, so a block of thirty squares is
 * still a single write.
 */
export async function saveEntryMetaBatch(poolId: string, metas: EntryMeta[]): Promise<void> {
  if (!metas.length) return;
  const now = new Date().toISOString();
  const rows = metas.map((meta) => ({
    contest_id: poolId,
    cell_index: meta.cell_index,
    // A batch upsert must send the same columns for every row, so the honest
    // "not asked yet" default is written rather than left out.
    paid_status: meta.paid_status ?? 'unknown',
    notify_opt_in: meta.notify_opt_in,
    contact_type: meta.contact_type || null,
    contact_value: meta.contact_value || null,
    seller_label: meta.seller_label?.trim() || null,
    updated_at: now,
  }));

  const { error } = await supabase
    .from('contest_entries')
    .upsert(rows, { onConflict: 'contest_id, cell_index' });

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
