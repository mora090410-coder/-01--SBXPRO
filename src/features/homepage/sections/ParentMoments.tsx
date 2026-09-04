import React from 'react';
import { Eyebrow, Glass, Reveal } from '../../../design/primitives';
import { BoardFragment } from '../artifacts/BoardFragment';
import { demoLive, demoWinnerNow } from '../demoData';
import { ScenariosRender, YourSquaresRender } from '../renders/MomentRenders';
import { HOVER_LIFT, HOVER_LIFT_STYLE } from '../renders/PhoneFrame';

const winning = { left: demoLive.leftScore % 10, top: demoLive.topScore % 10 };

const moments = [
  {
    heading: 'Where are my squares?',
    body: 'Type a name once. The board remembers it on that phone and lists every square as digits, with a tap to jump to the cell.',
    artifact: <YourSquaresRender />,
  },
  {
    heading: 'Who wins right now?',
    body: 'The current digits light one square. If it is yours, the board says so in one line, in gold.',
    artifact: (
      // The two neighbouring moments are `PhoneFrame`s, which already carry the
      // lift; this one is a bare Glass, so it borrows the same definition.
      <Glass padding="lg" style={HOVER_LIFT_STYLE} className={`flex flex-col gap-4 ${HOVER_LIFT}`}>
        <p className="font-ui text-[17px] font-medium text-gold">{demoWinnerNow} wins right now</p>
        <BoardFragment highlight={winning} />
      </Glass>
    ),
  },
  {
    heading: 'What score wins next?',
    body: 'A short list of scores that would put you on the winning square this game. Arithmetic, not odds or predictions.',
    artifact: <ScenariosRender />,
  },
];

/**
 * The rest between the green score moment and the gold organizer moment.
 *
 * This section deliberately carries NO `SectionTone`. The eye needs somewhere
 * to stop between the two lit moments, so the symmetry is broken on purpose —
 * do not add a tint here. With no tone there is nothing to clip and nothing to
 * stack against, so the section stays a plain block with no `relative z-10`.
 */
export function ParentMoments() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 py-16 md:px-12 md:py-20 flex flex-col gap-10 md:gap-12">
      <Reveal className="flex flex-col gap-3 max-w-[560px]">
        <Eyebrow>What a parent sees</Eyebrow>
        <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Three answers, no scrolling.</h2>
      </Reveal>
      {moments.map((m, i) => (
        // A hairline above each moment after the first. The rule is the spine of
        // this section: with no tone to light it, structure has to come from
        // rhythm, so the eye gets a repeated horizontal anchor instead of three
        // blocks floating in dark space.
        //
        // Top-aligned, NOT centred. These artifacts are real component renders and
        // the tallest runs past 600px; centring short copy against that sank each
        // heading into the middle of the row and left a hole above it.
        <Reveal
          key={m.heading}
          delay={i * 120}
          className={`grid gap-8 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-start md:gap-12 ${i > 0 ? 'border-t border-hairline pt-10 md:pt-12' : ''} ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}
        >
          <div className="flex flex-col gap-3 max-w-[460px]">
            <h3 className="font-display text-[28px] leading-[1.1] text-fg md:text-[32px]">{m.heading}</h3>
            <p className="font-ui text-[17px] leading-[1.5] text-fg-2">{m.body}</p>
          </div>
          <div className={`w-full max-w-[460px] ${i % 2 === 1 ? 'md:justify-self-start' : 'md:justify-self-end'}`}>{m.artifact}</div>
        </Reveal>
      ))}
    </section>
  );
}
