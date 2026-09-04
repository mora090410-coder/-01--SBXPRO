import React from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow, Glass, Numeral, Reveal, SectionTone } from '../../../design/primitives';
import { MONEY_BOUNDARY, PRICING, PRICING_SENTENCE } from '../pricing';
import { primaryLink, quietLink } from './cta';

const faq = [
  { q: 'Do viewers need an account?', a: 'No. Viewers open the link without creating an account. Only the organizer signs in.' },
  { q: 'Does GridOne collect square money?', a: `No. ${MONEY_BOUNDARY} Squares and payouts stay between you and your group.` },
  { q: 'When do I pay?', a: 'Building, editing, and previewing are free on every plan. Your first published board is free. You pay only when you publish a second board.' },
  { q: 'Who can edit the board?', a: 'Only the signed-in organizer. Everyone else sees the same live board. Published names change only through a visible, dated correction.' },
];

/**
 * One plan row. The fill lifts and the divider warms toward gold on hover AND on
 * `focus-within`, so a keyboard user reaching anything inside a row gets exactly
 * the affordance a mouse user gets. Both are colour changes, not motion, so they
 * stay on under `prefers-reduced-motion: reduce` — the duration token collapses
 * to the reduced value there and the state simply arrives sooner.
 *
 * The divider colour comes from the parent's `divide-hairline`, whose selector is
 * `:where()`-wrapped and therefore carries no specificity, so this row-level
 * `border-color` wins on hover without an important flag.
 */
const planRow =
  'flex flex-col gap-3 p-6 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4 transition-[background-color,border-color] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] hover:bg-panel-hover focus-within:bg-panel-hover hover:border-tone-gold/30 focus-within:border-tone-gold/30';

/**
 * The disclosure marker. The two-glyph `+` / `−` markup below is the state
 * signal and is never removed: open versus closed is carried by which glyph is
 * in the DOM, so the state survives with motion off, colour off, and CSS off.
 *
 * The rotation is decoration layered on top of that. It rests at `-90deg` when
 * closed and swings to `0deg` on open — a 90 degree turn either way. `+` is
 * symmetric under a quarter turn so the closed rest looks untouched, and what a
 * viewer actually sees is the `−` swinging down into place as the answer opens.
 *
 * The transition list names `rotate`, NOT `transform`: Tailwind v4 compiles
 * `-rotate-90` to the independent `rotate` property, so a list naming
 * `transform` transitions nothing and the marker snaps. The open value is
 * spelled `rotate-[0deg]` rather than `rotate-0` because `rotate-0` compiles to
 * `rotate: none`, and an explicit angle keeps both ends of the transition in
 * the same unit instead of relying on none-to-angle interpolation. Both
 * rotation classes sit behind `motion-safe:`, so under reduced motion the
 * marker never rotates at all and the glyph swap stands alone.
 */
const faqMarker =
  'inline-flex w-5 shrink-0 items-center justify-center font-mono text-[17px] text-fg-3 transition-[rotate] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] motion-safe:-rotate-90 motion-safe:group-open:rotate-[0deg]';

/**
 * The answer fades in on open. A closed `<details>` keeps its answer at
 * `display: none`, which no transition can cross, so this is a one-shot
 * animation that starts the moment the element is displayed. `motion-safe:`
 * drops it entirely under `prefers-reduced-motion: reduce`.
 */
const faqAnswer =
  'pb-4 font-ui text-[15px] leading-[1.5] text-fg-2 motion-safe:animate-[sheet-fade_var(--g-dur-spring)_var(--g-ease-state)]';

export function PriceAndClose() {
  return (
    <>
      {/* Cardinal on the left edge, closing the loop the hero opened on the right.
          The section clips and its content carries `relative z-10`, so the
          edge-anchored tint sits behind the copy and can never widen the page. */}
      <section className="relative overflow-hidden">
        <SectionTone tone="cardinal" side="left" />
        {/* Full-bleed section, capped content: the tone clips off-screen, not at
            a 1200px column edge. Padding lives inside the cap, so the column is
            unchanged from when the cap was a page-level wrapper. */}
        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6 py-16 md:px-12 md:py-24 grid gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">

        <Reveal className="relative z-10 flex flex-col gap-3 max-w-[460px]">
          <Eyebrow>2026 pricing</Eyebrow>
          <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Free to start. Pay when you publish another.</h2>
          <p className="font-ui text-[17px] leading-[1.5] text-fg-2">{PRICING_SENTENCE}</p>
          <p className="font-ui text-[15px] text-fg-3">{MONEY_BOUNDARY}</p>
        </Reveal>

        <Reveal delay={120} className="relative z-10">
          <Glass as="section" aria-label="Plans" padding="none" className="divide-y divide-hairline">
            {PRICING.map((tier) => (
              <div key={tier.id} className={planRow}>
                {/* The free figure is gold: the offer, not one of three equal rows.
                    The other two tiers keep the default figure colour. */}
                <Numeral
                  value={tier.price}
                  secondary={tier.priceNote}
                  size="md"
                  label={`${tier.price} ${tier.priceNote}`}
                  className={`sm:order-2 sm:justify-self-end${tier.id === 'free' ? ' [&>span:first-child]:text-tone-gold' : ''}`}
                />
                <div className="flex flex-col gap-1">
                  <h3 className="font-ui text-[17px] font-medium text-fg">{tier.name}</h3>
                  <p className="font-ui text-[15px] text-fg-2">{tier.detail}</p>
                </div>
              </div>
            ))}
          </Glass>
        </Reveal>
        </div>
      </section>

      {/* Deliberately untinted. The last thing on screen is the action, not the
          atmosphere, so this section carries no `SectionTone` — do not add one. */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-16 md:px-12 md:py-24">
        <div className="flex flex-col gap-8 max-w-[720px]">
        <Reveal className="flex flex-col gap-8">
          <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Ready to build the board?</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/create" className={primaryLink}>Create your free board</Link>
            <Link to="/demo" className={quietLink}>See a live board</Link>
          </div>
        </Reveal>
        <Reveal delay={120} className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {faq.map((item) => (
            <details key={item.q} className="group py-2">
              <summary className="min-h-11 flex items-center justify-between gap-4 cursor-pointer font-ui text-[17px] text-fg list-none [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span aria-hidden="true" className={faqMarker}>
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <p className={faqAnswer}>{item.a}</p>
            </details>
          ))}
        </Reveal>
        </div>
      </section>
    </>
  );
}
