import React, { useRef } from 'react';
import { Eyebrow, Reveal } from '../../../design/primitives';
import { BoardFill } from '../artifacts/BoardFill';
import { useFillDriven, useScrollProgress } from '../atmosphere/useScrollProgress';
import { demoGame } from '../demoData';

/**
 * Three facts, not three claims. Each one is checkable against the board sitting
 * next to it: count the squares, read the OPEN tiles, watch the axis digits
 * arrive last. Nothing here promises a result.
 */
const FACTS = [
  '100 squares. Your group fills them.',
  'Open squares stay clearly marked.',
  'Draw the numbers when you\'re ready.',
] as const;

const EXAMPLE_MATCHUP = demoGame.meta.split(' · ')[0];

/**
 * The board fills as you scroll, with the facts accumulating beside it.
 *
 * On `md` and up the board pins at `top-24` while the copy column scrolls past
 * it, and the scroll position drives `--fill-progress` on the board's root. The
 * copy column's height IS the fill's timeline: each fact occupies its own
 * `46vh` block, so the section is roughly 140vh of travel and the squares land
 * across it with the axis digits drawing in the last stretch.
 *
 * Below `md` none of that happens, deliberately. The board is not sticky, gets
 * no `progress`, and renders finished. A phone has neither the height to pin a
 * 10x10 board usefully nor the patience for a section that holds the scroll,
 * and a pinned element on a phone is the fastest way to make a page feel stuck.
 *
 * The same finished board is what a reduced-motion reader, a no-JS document,
 * and a browser without `IntersectionObserver` all get — see `useFillDriven`,
 * which starts `false` so the first paint is always the resting state. The
 * three facts are plain `Reveal`s, so they are present and legible in every one
 * of those cases too; they accumulate because the column is tall, not because
 * anything gates them.
 */
export function BoardFillSection() {
  // Measured vs. written: the board is `position: sticky` while it fills, so
  // its own rect.top is a constant and it cannot measure its own travel. The
  // section does the measuring; the board's root takes the write, because an
  // element's own `--fill-progress` shadows an inherited one.
  const sectionRef = useRef<HTMLElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const driven = useFillDriven();

  useScrollProgress({ ref: boardRef, trackRef: sectionRef, disabled: !driven });

  return (
    <section
      ref={sectionRef}
      data-testid="board-fill-section"
      className="relative overflow-x-clip"
    >
      {/* Full-bleed section, content capped at 1200px, exactly like its
          neighbours. No SectionTone of its own: it sits between the hero's
          cardinal and the score section's live, and a third tone in that gap
          would turn a journey into a swatch board. */}
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6 py-16 md:px-12 md:py-24">
        <div className="grid gap-8 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:items-start md:gap-x-16 md:gap-y-8">
          <Reveal className="flex max-w-[520px] flex-col gap-3 md:col-start-2 md:row-start-1">
            <Eyebrow>How a board fills</Eyebrow>
            <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">
              Add your names. Then draw the numbers.
            </h2>
          </Reveal>

          {/* Sticky only from md up, and only when the board is actually going
              to fill. Under reduced motion the board is already finished, so
              pinning it would hold ~1.8 viewports of layout and return nothing.
              `driven` also stays false on phone and without an observer, keeping
              every static fallback compact. */}
          <figure className={`m-0 md:col-start-1 md:row-start-1 md:row-span-2 ${driven ? 'md:sticky md:top-24' : ''}`.trim()}>
            <BoardFill
              ref={boardRef}
              progress={driven ? 0 : undefined}
              className="mx-auto w-full max-w-[440px]"
            />
            <figcaption className="mx-auto mt-3 w-full max-w-[440px] font-mono text-[12px] uppercase leading-none tracking-[0.12em] text-fg-3">
              Example board · {EXAMPLE_MATCHUP}
            </figcaption>
          </figure>

          <div className="flex flex-col gap-8 md:col-start-2 md:row-start-2">
            <ul className={`flex flex-col gap-6 ${driven ? 'md:gap-0' : ''}`.trim()}>
              {FACTS.map((fact, i) => (
                <Reveal
                  as="li"
                  key={fact}
                  delay={i * 60}
                  className={`flex items-start ${driven ? 'md:min-h-[46vh] md:items-center' : ''}`.trim()}
                >
                  <p className="flex max-w-[420px] items-start gap-3 font-ui text-[17px] leading-[1.5] text-fg-2">
                    {/* The tick: a short hairline rule, not a bullet glyph. */}
                    <span aria-hidden="true" className="mt-[6px] h-[14px] w-px shrink-0 bg-fg-3" />
                    <span>{fact}</span>
                  </p>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
