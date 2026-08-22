import React from 'react';
import type { LiveGameData, NotificationDeliveryIssue } from '../../../types';

export default function GameDayControls({
  liveData,
  shareCode,
  issues,
  onOpenViewer,
}: {
  liveData: LiveGameData | null;
  shareCode: string | null;
  issues: NotificationDeliveryIssue[];
  onOpenViewer?: () => void;
}) {
  return (
    <section role="region" aria-label="Game-day controls" className="grid gap-3 border border-ink p-4">
      <h2 className="text-2xl font-semibold">Game-day controls</h2>
      <p>Score authority: {liveData?.isManual ? 'Manual scoring authority' : 'Automatic scoring authority'}.</p>
      {shareCode && onOpenViewer ? (
        <button type="button" className="oa-btn oa-btn-primary" onClick={onOpenViewer}>Open viewer /b/{shareCode}</button>
      ) : (
        <p>Viewer link unavailable until the server returns a share code.</p>
      )}
      <p>Manual authority changes remain in the legacy server-backed controls until the v2 callback seam exists.</p>
      {issues.length ? <p role="status">Review delivery issue</p> : <p>No delivery issues.</p>}
    </section>
  );
}
