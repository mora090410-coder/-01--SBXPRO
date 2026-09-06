import React, { useLayoutEffect, useRef } from 'react';
import { Reveal, SectionTone } from '../../../design/primitives';
import { OrganizerPreview } from '../renders/OrganizerPreview';
import './studioChapters.css';

export function OrganizerSection() {
  const previewRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const preview = previewRef.current;
    if (!preview || typeof ResizeObserver === 'undefined') return;
    const sync = () => preview.style.setProperty('--g-studio-organizer-scale', String((preview.clientWidth - 2) / 800));
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(preview);
    return () => observer.disconnect();
  }, []);
  return (
    <section data-sc-act="flow" className="studio-organizer relative overflow-x-clip" aria-labelledby="studio-organizer-heading">
      <SectionTone tone="gold" side="right" />
      <div className="studio-chapter relative z-10">
        <Reveal className="studio-organizer-intro studio-chapter-intro">
          <h2 id="studio-organizer-heading">One screen. No wizard.</h2>
          <div>
            <p>Name the board. Add your names. Draw the numbers, preview your group’s link, then publish.</p>
            <p className="studio-organizer-detail">You control the board. Payment and seller details stay private. OPEN squares stay visible.</p>
          </div>
        </Reveal>
        <Reveal className="studio-organizer-artifact" delay={120}>
          <div className="studio-organizer-caption"><span>YOUR ORGANIZER WORKSPACE</span><span>Sample board</span></div>
          <div ref={previewRef}><OrganizerPreview className="studio-organizer-preview" /></div>
        </Reveal>
      </div>
    </section>
  );
}
