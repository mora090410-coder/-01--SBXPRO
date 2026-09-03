import React, { Suspense } from 'react';
import { demoGame, demoLive } from '../demoData';
import { PhoneFrame } from './PhoneFrame';

const HeroViewerInner = React.lazy(() => import('./HeroViewerInner'));

export const HERO_VIEWER_CAPTION =
  `Sample live board: ${demoGame.leftAbbr} ${demoLive.leftScore}, ${demoGame.topAbbr} ${demoLive.topScore}, third quarter`;

/** The hero picture: the real viewer, loaded after the first paint and frozen behind the frame. */
export function HeroViewer({ className = '' }: { className?: string }) {
  return (
    <Suspense fallback={<PhoneFrame caption={HERO_VIEWER_CAPTION} className={className} />}>
      <PhoneFrame caption={HERO_VIEWER_CAPTION} className={className}>
        <HeroViewerInner />
      </PhoneFrame>
    </Suspense>
  );
}
