import type { BoardData, EntryMeta } from '../../../../types';
import { demoBoard } from '../demoData';

export const ORGANIZER_FILLED = 61;
export const ORGANIZER_PAID = 40;

/** Every real name on the demo board, in board order, with the OPEN placeholders dropped. */
const namePool = demoBoard.squares
  .map((names) => names[0] ?? '')
  .filter((name) => name !== '' && name !== 'OPEN');

/** A half-sold board: the first 61 squares carry names, the rest are still open. */
export const organizerDemoBoard: BoardData = {
  ...demoBoard,
  squares: Array.from({ length: 100 }, (_, index) => (
    index < ORGANIZER_FILLED ? [namePool[index % namePool.length]!] : []
  )),
};

export const organizerDemoEntryMeta: Record<number, EntryMeta> = Object.fromEntries(
  Array.from({ length: ORGANIZER_FILLED }, (_, index) => [index, {
    cell_index: index,
    paid_status: index < ORGANIZER_PAID ? 'paid' : 'unpaid',
    notify_opt_in: false,
    contact_type: null,
    contact_value: null,
    seller_label: null,
  } satisfies EntryMeta]),
);

export const ORGANIZER_PREVIEW_CAPTION = `Organizer workspace with ${ORGANIZER_FILLED} of 100 squares filled`;
