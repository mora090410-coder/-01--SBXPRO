import React from 'react';
import { Eyebrow, Reveal, SectionTone } from '../../../design/primitives';
import { OrganizerPreview } from '../renders/OrganizerPreview';

export function OrganizerSection() {
  return (
    <section className="relative overflow-hidden">
      <SectionTone tone="gold" side="right" />
      {/* Full-bleed section, capped content: the tone clips off-screen, not at
          a 1200px column edge. Padding lives inside the cap, so the column is
          unchanged from when the cap was a page-level wrapper. */}
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6 py-16 md:px-12 md:py-24 grid gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
      {/* The organizer workroom, late in the evening: warm gold on the right edge.
          The section clips and the two columns below carry `relative z-10`, so the
          edge-anchored tint sits behind the copy and can never widen the document. */}

      <Reveal className="relative z-10 flex flex-col gap-3 max-w-[460px]">
        <Eyebrow>For the organizer</Eyebrow>
        <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">One screen. No wizard.</h2>
        <p className="font-ui text-[17px] leading-[1.5] text-fg-2">
          Name the board, pick the game, tap squares to add names. Draw the numbers, preview the exact link your group will open, go live. Everything stays editable in place until kickoff, and only you can change it.
        </p>
        <p className="font-ui text-[15px] text-fg-3">OPEN squares stay visible so nobody argues about who had what.</p>
      </Reveal>

      <Reveal delay={120} className="relative z-10">
        <OrganizerPreview />
      </Reveal>
      </div>
    </section>
  );
}
