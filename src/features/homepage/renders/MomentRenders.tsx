import React, { Suspense } from 'react';
import { demoWinnerNow, demoWinnerSquares } from '../demoData';
import { PhoneFrame } from './PhoneFrame';

const YourSquaresInner = React.lazy(() => import('./YourSquaresInner'));
const ScenariosInner = React.lazy(() => import('./ScenariosInner'));

export const YOUR_SQUARES_CAPTION =
  `Sample square summary: ${demoWinnerNow} holds ${demoWinnerSquares.length} squares on the demo board`;

export const SCENARIOS_CAPTION =
  'Sample list of scores that change the next result on the demo board';

/** Moment 1: the real summary that answers "where are my squares?". */
export function YourSquaresRender() {
  return (
    <Suspense fallback={<PhoneFrame aspect="auto" caption={YOUR_SQUARES_CAPTION} />}>
      <PhoneFrame aspect="auto" caption={YOUR_SQUARES_CAPTION}>
        <YourSquaresInner />
      </PhoneFrame>
    </Suspense>
  );
}

/** Moment 3: the real list of scores that change the next result. */
export function ScenariosRender() {
  return (
    <Suspense fallback={<PhoneFrame aspect="auto" caption={SCENARIOS_CAPTION} />}>
      <PhoneFrame aspect="auto" caption={SCENARIOS_CAPTION}>
        <ScenariosInner />
      </PhoneFrame>
    </Suspense>
  );
}
