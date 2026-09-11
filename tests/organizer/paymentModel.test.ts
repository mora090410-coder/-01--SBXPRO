import { expect, it } from 'vitest';
import type { BoardData, EntryMeta } from '../../types';
import { buildPaymentModel } from '../../src/features/organizer/payments/paymentModel';

it('groups by responsibility before exact trimmed joint names and counts allocation-only squares', () => {
  const board: BoardData = { leftAxis: [], topAxis: [], squares: [['Buyer'], [], [' Alex '], ['Alex'], ['alex'], ['Alex', 'Sam'], ['Alex & Sam'], []], allocationLabels: ['Family', 'Family'] };
  const meta = (cell_index: number, paid_status: EntryMeta['paid_status']): EntryMeta => ({ cell_index, paid_status, notify_opt_in: false, contact_type: null, contact_value: null });
  const metas = { 0: meta(0, 'paid'), 2: meta(2, 'unpaid') };
  const model = buildPaymentModel(board, metas);
  expect(model.totals).toEqual({ assigned: 7, paid: 1, unpaid: 1, unknown: 5 });
  expect(model.groups.map(g => [g.label, g.squares.map(s => s.index)])).toEqual([
    ['Family', [0, 1]], ['Alex', [2, 3]], ['alex', [4]], ['Alex & Sam', [5]], ['Alex & Sam', [6]],
  ]);
  expect(model.groups[0]).toMatchObject({ paid: 1, unpaid: 0, unknown: 1 });
  expect(new Set(model.groups.map(g => g.id)).size).toBe(5);
});
