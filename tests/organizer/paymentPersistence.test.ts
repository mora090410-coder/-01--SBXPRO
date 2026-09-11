import { beforeEach, describe, expect, it, vi } from 'vitest';

const { upsert, select } = vi.hoisted(() => ({ upsert: vi.fn(), select: vi.fn() }));
vi.mock('../../services/supabase', () => ({ supabase: { from: () => ({ upsert }) } }));
import { savePaymentStatuses } from '../../src/features/organizer/workspace/entryMetaService';

beforeEach(() => {
  vi.clearAllMocks();
  upsert.mockReturnValue({ select });
  select.mockResolvedValue({ data: [
    { cell_index: 2, paid_status: 'paid', seller_label: 'Original seller', contact_value: 'private@example.test', contact_type: 'email', notify_opt_in: true },
    { cell_index: 7, paid_status: 'paid', seller_label: null, contact_value: null, contact_type: null, notify_opt_in: false },
  ], error: null });
});

describe('payment-only persistence', () => {
  it('writes only selected payment fields and returns saved private metadata', async () => {
    const result = await savePaymentStatuses('board-1', [2, 7, 2], 'paid');
    expect(upsert).toHaveBeenCalledWith([
      { contest_id: 'board-1', cell_index: 2, paid_status: 'paid' },
      { contest_id: 'board-1', cell_index: 7, paid_status: 'paid' },
    ], { onConflict: 'contest_id, cell_index', defaultToNull: false });
    expect(result[0]).toMatchObject({ seller_label: 'Original seller', notify_opt_in: true, contact_value: 'private@example.test' });
  });
  it('rejects an incomplete receipt instead of reporting that every square saved', async () => {
    select.mockResolvedValue({ data: [{ cell_index: 2, paid_status: 'paid' }], error: null });
    await expect(savePaymentStatuses('board-1', [2, 7], 'paid')).rejects.toThrow(/confirm/i);
  });
  it('propagates a failed write and does not retry automatically', async () => {
    select.mockResolvedValue({ data: null, error: { message: 'Offline' } });
    await expect(savePaymentStatuses('board-1', [2], 'unpaid')).rejects.toThrow('Offline');
    expect(upsert).toHaveBeenCalledTimes(1);
  });
  it.each([[-1], [100], [1.5]])('rejects invalid square indices %s before writing', async indices => {
    await expect(savePaymentStatuses('board-1', [indices], 'unknown')).rejects.toThrow(/square/i);
    expect(upsert).not.toHaveBeenCalled();
  });
  it('does not send an empty batch', async () => {
    expect(await savePaymentStatuses('board-1', [], 'paid')).toEqual([]);
    expect(upsert).not.toHaveBeenCalled();
  });
});
