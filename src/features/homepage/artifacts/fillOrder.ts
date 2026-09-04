import { demoBoard, demoWinnerSquares } from '../demoData';

/**
 * The order a board fills in.
 *
 * A real board does not fill row by row. Squares get claimed in scattered
 * handfuls as people pick, so a left-to-right sweep would read as a loading
 * bar rather than as a board being filled. The order here is shuffled for
 * that reason, and seeded so it is identical on every reload and in every
 * test — a scroll animation that reshuffles itself is a different animation
 * each time it is seen, which is not a thing anyone can review.
 */

/** The demo game's date, used as the seed so the number is not arbitrary. */
export const FILL_SEED = 20260118;

/** Where the payoff lands: no earlier than this fraction through the order. */
const PAYOFF_FROM = 0.75;

/**
 * The winning square's index on the 100-square board, derived from
 * `demoWinnerSquares` and the two axes so it can never drift from the data.
 */
export const WINNER_INDEX = (() => {
  const winner = demoWinnerSquares[0]!;
  const row = demoBoard.leftAxis.indexOf(winner.left);
  const col = demoBoard.topAxis.indexOf(winner.top);
  return row * 10 + col;
})();

/**
 * mulberry32. Thirty-two bits of state, four lines, no dependency. Good enough
 * for a decorative shuffle and, unlike `Math.random`, reproducible.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A deterministic shuffle of the 100 square indexes: `fillOrder()[k]` is the
 * board index that gets claimed `k`-th.
 *
 * The winning square is then forced into the last quarter of the order. That
 * is the one thing about this sequence that is not decorative: the gold square
 * is the payoff of the whole section, and a shuffle that happened to place it
 * third would spend the reveal before the reader has started reading. The move
 * is a single swap with a position drawn from the same seeded stream, so the
 * result is still a permutation and still reproducible.
 */
export function fillOrder(seed: number = FILL_SEED): number[] {
  const random = mulberry32(seed);
  const order = Array.from({ length: 100 }, (_, i) => i);

  // Fisher-Yates, back to front.
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }

  const tail = Math.floor(order.length * PAYOFF_FROM);
  const at = order.indexOf(WINNER_INDEX);
  if (at < tail) {
    const target = tail + Math.floor(random() * (order.length - tail));
    [order[at], order[target]] = [order[target]!, order[at]!];
  }

  return order;
}

/** Squares finish filling here, leaving the tail of the scroll to the digits. */
export const SQUARE_SPAN = 0.76;

/** Axis digits start rolling here — after the last square has landed. */
export const AXIS_FROM = 0.85;

/** …and the last digit lands by here. */
export const AXIS_TO = 0.9;

/**
 * `--fill-threshold` for every board index, keyed by index rather than by
 * position so a cell can look its own value up in one read at render time.
 * Computed once per module, not once per cell per render.
 */
export function fillThresholds(seed: number = FILL_SEED): number[] {
  const order = fillOrder(seed);
  const thresholds = new Array<number>(order.length);
  order.forEach((index, position) => {
    thresholds[index] = Number(((position / (order.length - 1)) * SQUARE_SPAN).toFixed(4));
  });
  return thresholds;
}

/** `--fill-threshold` for the i-th digit on an axis: a short stagger, in order. */
export function axisThreshold(i: number, count = 10): number {
  const span = count > 1 ? i / (count - 1) : 0;
  return Number((AXIS_FROM + span * (AXIS_TO - AXIS_FROM)).toFixed(4));
}
