import React, { Suspense } from 'react';
import { Glass } from '../../../design/primitives';
import { ORGANIZER_PREVIEW_CAPTION } from './organizerDemoData';

const OrganizerPreviewInner = React.lazy(() => import('./OrganizerPreviewInner'));

const SHELL_WIDTH = 560;
const DEVICE_WIDTH = 800;

function OrganizerFrame({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <Glass as="figure" padding="none" className={`w-full max-w-[560px] aspect-[4/3] overflow-hidden ${className}`.trim()}>
      <div
        inert
        aria-hidden="true"
        style={{ width: DEVICE_WIDTH, height: DEVICE_WIDTH * 0.75, transform: `scale(${SHELL_WIDTH / DEVICE_WIDTH})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
      <figcaption className="sr-only">{ORGANIZER_PREVIEW_CAPTION}</figcaption>
    </Glass>
  );
}

/** The organizer screen as a picture: real components, loaded after the first paint, frozen behind the frame. */
export function OrganizerPreview({ className = '' }: { className?: string }) {
  return (
    <Suspense fallback={<OrganizerFrame className={className} />}>
      <OrganizerFrame className={className}>
        <OrganizerPreviewInner />
      </OrganizerFrame>
    </Suspense>
  );
}
