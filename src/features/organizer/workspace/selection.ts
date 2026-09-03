/**
 * Square selection maths for range assignment. Pure functions, no React: a
 * selection is an immutable set of 0-99 cell indices on the 10x10 grid.
 */

export type Selection = ReadonlySet<number>;

const COLS = 10;

/** Adds the index when absent, removes it when present. */
export function toggle(sel: Selection, index: number): Selection {
  const next = new Set(sel);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  return next;
}

/**
 * Every index inside the rectangle whose opposite corners are `a` and `b`,
 * row-major and inclusive. A block on the board is what an organizer means by
 * "these squares", not the run of indices between them.
 */
export function rangeBetween(a: number, b: number): number[] {
  const rowA = Math.floor(a / COLS);
  const rowB = Math.floor(b / COLS);
  const colA = a % COLS;
  const colB = b % COLS;
  const rowStart = Math.min(rowA, rowB);
  const rowEnd = Math.max(rowA, rowB);
  const colStart = Math.min(colA, colB);
  const colEnd = Math.max(colA, colB);
  const out: number[] = [];
  for (let row = rowStart; row <= rowEnd; row += 1) {
    for (let col = colStart; col <= colEnd; col += 1) {
      out.push(row * COLS + col);
    }
  }
  return out;
}

/**
 * Splits the selected indices into the ones this board will accept and the
 * ones it refuses. A published board only accepts OPEN cells: a sold square is
 * the record families are reading.
 */
export function assignable(
  indices: readonly number[],
  squares: readonly string[][],
  isPublished: boolean,
): { ok: number[]; blocked: number[] } {
  const ok: number[] = [];
  const blocked: number[] = [];
  for (const index of indices) {
    const filled = (squares[index]?.length ?? 0) > 0;
    if (isPublished && filled) blocked.push(index);
    else ok.push(index);
  }
  return { ok, blocked };
}
