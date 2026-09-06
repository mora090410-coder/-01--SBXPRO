import React from 'react';
import { CapsuleTag, Eyebrow, Glass, Numeral } from '../../../design/primitives';
import { demoGame, demoLive } from '../demoData';

const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(new Date(demoLive.retrievedAt));

/** True score values remain readable throughout the decorative presentation. */
export function ScoreMoment() {
  return (
    <Glass as="section" aria-label="Live score" padding="lg" className="studio-score-instrument flex flex-col gap-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-4">
        <div className="flex flex-col gap-3 min-w-0">
          <Eyebrow>{demoGame.leftName}</Eyebrow>
          <Numeral value={demoLive.leftScore} size="xl" label={`${demoGame.leftName} ${demoLive.leftScore}`} />
        </div>
        <div className="flex flex-col items-center gap-2 pb-2">
          <CapsuleTag tone="live">
            {/* Decorative only. The word "Live" carries the meaning; the dot never
                stands alone as a signal, and its pulse is off under reduced motion. */}
            <span aria-hidden="true" className="live-dot mr-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-tone-live" />
            Live · Q{demoLive.period}
          </CapsuleTag>
          <span className="font-mono tabular-nums text-[14px] text-fg-2">{demoLive.clock}</span>
        </div>
        <div className="flex flex-col items-end gap-3 text-right min-w-0">
          <Eyebrow>{demoGame.topName}</Eyebrow>
          <Numeral value={demoLive.topScore} size="xl" label={`${demoGame.topName} ${demoLive.topScore}`} />
        </div>
      </div>
      <p className="font-mono text-[13px] text-fg-3">{demoLive.sourceName} · updated {time}</p>
    </Glass>
  );
}
