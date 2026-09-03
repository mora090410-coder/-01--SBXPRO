import React from 'react';
import { Eyebrow, Reveal, SectionTone } from '../../../design/primitives';
import { ScoreMoment } from '../artifacts/ScoreMoment';

export function ScoreSection() {
  return (
    <section className="relative overflow-hidden px-6 py-16 md:px-12 md:py-24 flex flex-col gap-8">
      {/* The broadcast moment: field green on the left edge. Content below carries
          `relative z-10`, and the section clips, so the edge-anchored tint can
          never widen the document. */}
      <SectionTone tone="live" side="left" />

      <Reveal className="relative z-10 flex flex-col gap-3 max-w-[560px]">
        <Eyebrow>The score follows the game</Eyebrow>
        <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Scores update themselves.</h2>
        <p className="font-ui text-[17px] leading-[1.5] text-fg-2">
          You don't refresh, you don't type, you don't argue. Every score on the board shows where it came from and when it was checked, and you can enter a score yourself any time.
        </p>
      </Reveal>

      <Reveal delay={120} className="relative z-10">
        <ScoreMoment />
      </Reveal>
    </section>
  );
}
