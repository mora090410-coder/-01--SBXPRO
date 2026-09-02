import React from 'react';
import NotificationOptIn from '../../../../components/NotificationOptIn';

export interface WinnerEmailDisclosureProps {
  shareCode?: string | null;
  participantId?: string;
  displayName: string;
  enabled: boolean;
}

const WinnerEmailDisclosure: React.FC<WinnerEmailDisclosureProps> = ({ shareCode, participantId, displayName, enabled }) => {
  if (!enabled || !shareCode || !participantId || !displayName || displayName.trim().toUpperCase() === 'OPEN') return null;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="winner-email-title">
      <h2 id="winner-email-title" className="font-display text-[26px] leading-[1.1] text-fg">Get winner emails</h2>
      <div role="form" aria-label="winner email">
        <NotificationOptIn shareCode={shareCode} participantId={participantId} displayName={displayName} />
      </div>
    </section>
  );
};

export default WinnerEmailDisclosure;
