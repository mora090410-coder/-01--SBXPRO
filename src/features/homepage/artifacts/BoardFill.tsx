import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from '../../../design/primitives';
import { demoBoard, demoGame, demoWinnerNow, demoWinnerSquares } from '../demoData';
import { WINNER_INDEX, axisThreshold, fillThresholds } from './fillOrder';

export interface BoardFillProps {
  /**
   * Fill position, 0 to 1. Omit it and the board is finished and static — that
   * is the resting state, and it is the one a server render, a browser with no
   * JS, and a reader who asked for less motion all see.
   */
  progress?: number;
  className?: string;
  /**
   * Optional handle on the grid's root, so a scroll driver can write
   * `--fill-progress` onto the same element that carries `data-fill`.
   */
  ref?: React.Ref<HTMLDivElement | null>;
}

const WINNER = demoWinnerSquares[0]!;

const LABEL = `Example board: ${demoGame.title} — 100 squares for ${demoGame.meta}. `
  + `The winning square is ${demoGame.topAbbr} ${WINNER.top}, ${demoGame.leftAbbr} ${WINNER.left}, held by ${demoWinnerNow}.`;

/** Custom properties are not in React's `CSSProperties`; this is the narrow cast. */
type CellStyle = React.CSSProperties & Record<'--fill-threshold', string>;

const cellStyle = (threshold: number): CellStyle => ({ '--fill-threshold': String(threshold) });

/**
 * The whole 10x10, filling in.
 *
 * **The resting state is the finished board.** The markup carries no
 * `data-fill` attribute and no `--fill-progress`, so the rules in `tokens.css`
 * give every square full opacity and give the axis digits no animation at all.
 * That is what renders with no JS, with no `IntersectionObserver`, and under
 * `prefers-reduced-motion: reduce`. `BoardFill` adds the attribute only from a
 * `useLayoutEffect`, which runs before paint, and only when a caller has asked
 * for a `progress` AND motion is allowed AND an observer exists — the same
 * contract `Reveal` holds, for the same reason. The reduced-motion block in
 * `tokens.css` neutralizes `data-fill` a second time, in case the preference
 * flips after the attribute is on.
 *
 * **One style write per frame.** Nothing here re-renders while the board
 * fills, and no class or attribute is touched on any of the 100 cells. The
 * root carries `--fill-progress`; each cell carries a `--fill-threshold` fixed
 * at render; and the cell works out its own opacity in CSS from the two. A
 * scroll frame is therefore a single `setProperty` on one element, which the
 * style engine fans out — not a hundred React nodes and a hundred writes.
 *
 * **The animation carries no meaning.** The grid is one `role="img"` whose
 * label names the board, the matchup, and the winning square. Every cell is
 * `aria-hidden`. A reader who never sees a frame of this loses nothing.
 */
export function BoardFill({ progress, className = '', ref }: BoardFillProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const thresholds = useMemo(() => fillThresholds(), []);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  const animate = typeof progress === 'number' && Number.isFinite(progress);

  useLayoutEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    // No caller-driven progress, no motion budget, or no observer to drive it:
    // stay finished, carry no attribute, and write no custom property. The
    // board is never blank, not even for one frame.
    if (!animate || reduced || typeof IntersectionObserver === 'undefined') {
      node.removeAttribute('data-fill');
      node.style.removeProperty('--fill-progress');
      return;
    }

    node.setAttribute('data-fill', 'on');
    // Written imperatively rather than through `style`, so a scroll driver
    // holding the same element can keep writing it without React reclaiming
    // the value on its next render.
    // Clamped: a negative value would hold `digit-roll`'s from-state and floor
    // every square, blanking the board through the component's own prop.
    node.style.setProperty('--fill-progress', String(Math.min(1, Math.max(0, progress))));
    return () => {
      node.removeAttribute('data-fill');
      node.style.removeProperty('--fill-progress');
    };
  }, [animate, reduced, progress]);

  return (
    // The cell and hairline tokens are translucent, so the board carries its own
    // opaque ground — without it the squares composite over whatever section
    // tone sits behind them and the quiet OPEN label loses its contrast margin.
    <div
      ref={setRefs}
      role="img"
      aria-label={LABEL}
      className={`bg-ground rounded-card p-2 ${className}`.trim()}
    >
      <div className="grid gap-px" style={{ gridTemplateColumns: 'minmax(18px, 0.6fr) repeat(10, minmax(0, 1fr))' }}>
        <div aria-hidden="true" />
        {demoBoard.topAxis.map((digit, i) => (
          <div
            key={`t${i}`}
            aria-hidden="true"
            data-axis="top"
            style={cellStyle(axisThreshold(i))}
            className="board-fill-axis flex items-center justify-center font-mono text-[10px] md:text-[12px] text-fg-3 leading-none pb-1"
          >
            {digit}
          </div>
        ))}
        {demoBoard.leftAxis.map((leftDigit, r) => (
          <React.Fragment key={`r${r}`}>
            <div
              aria-hidden="true"
              data-axis="left"
              style={cellStyle(axisThreshold(r))}
              className="board-fill-axis flex items-center justify-center font-mono text-[10px] md:text-[12px] text-fg-3 leading-none pr-1"
            >
              {leftDigit}
            </div>
            {demoBoard.topAxis.map((topDigit, c) => {
              const index = r * 10 + c;
              const name = demoBoard.squares[index]?.[0] ?? '';
              const isOpen = name === 'OPEN' || name === '';
              const isWinner = index === WINNER_INDEX;
              return (
                <div
                  key={`c${index}`}
                  aria-hidden="true"
                  data-cell={`${leftDigit}-${topDigit}`}
                  className="board-fill-cell relative aspect-square rounded-cell"
                >
                  <div
                    data-fill-cell={index}
                    style={cellStyle(thresholds[index]!)}
                    className={`board-fill-in absolute inset-0 flex items-center justify-center rounded-cell px-[2px] text-center font-ui text-[7px] md:text-[9px] leading-[1.15] overflow-hidden ${
                      // A filled square lifts off the ground to `bg-panel`; OPEN keeps
                      // BoardFragment's rule and sits one step lighter still, so the two
                      // states differ by surface and not only by the word.
                      isWinner ? 'bg-gold text-ink font-medium' : isOpen ? 'bg-panel-hover text-fg' : 'bg-panel text-fg'
                    }`}
                  >
                    {isOpen ? 'OPEN' : name}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
