import React, { useEffect, useRef, useState } from 'react';
import { CapsuleTag, Eyebrow, Glass, Numeral } from '../../../design/primitives';
import { useCountUp } from '../atmosphere/useCountUp';
import { demoGame, demoLive } from '../demoData';

const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(new Date(demoLive.retrievedAt));

/**
 * Full-width live score instrument. The differentiator, shown as the product shows it.
 *
 * Only the two team numerals move: they roll to their value once, when the
 * panel enters view. Everything that is truth — the quarter, the clock, the
 * source, and the checked time — is in the DOM final and unanimated, readable
 * on first paint. The accessible names of both numerals also carry the real
 * scores at all times, so assistive tech never hears a mid-roll figure.
 */
export function ScoreMoment() {
  const panel = useRef<HTMLElement | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const node = panel.current;
    // No observer: `entered` stays false, and useCountUp then holds the real scores.
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEntered(true);
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const leftScore = useCountUp(demoLive.leftScore, { started: entered });
  const topScore = useCountUp(demoLive.topScore, { started: entered });

  return (
    <Glass ref={panel} as="section" aria-label="Live score" padding="lg" className="flex flex-col gap-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-4">
        <div className="flex flex-col gap-3 min-w-0">
          <Eyebrow>{demoGame.leftName}</Eyebrow>
          <Numeral value={leftScore} size="xl" label={`${demoGame.leftName} ${demoLive.leftScore}`} />
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
          <Numeral value={topScore} size="xl" label={`${demoGame.topName} ${demoLive.topScore}`} />
        </div>
      </div>
      <p className="font-mono text-[13px] text-fg-3">{demoLive.sourceName} · updated {time}</p>
    </Glass>
  );
}
