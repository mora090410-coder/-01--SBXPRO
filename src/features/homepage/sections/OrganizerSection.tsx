import React from 'react';
import { Eyebrow } from '../../../design/primitives';
import { OrganizerCard } from '../artifacts/OrganizerCard';

export function OrganizerSection() {
  return (
    <section className="px-6 py-16 md:px-12 md:py-24 grid gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
      <div className="flex flex-col gap-3 max-w-[460px]">
        <Eyebrow>For the organizer</Eyebrow>
        <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">One screen. No wizard.</h2>
        <p className="font-ui text-[17px] leading-[1.5] text-fg-2">
          Name the board, pick the game, tap squares to add names. Draw the numbers, preview the exact link your group will open, go live. Everything stays editable in place until kickoff, and only you can change it.
        </p>
        <p className="font-ui text-[15px] text-fg-3">OPEN squares stay visible so nobody argues about who had what.</p>
      </div>
      <OrganizerCard />
    </section>
  );
}
