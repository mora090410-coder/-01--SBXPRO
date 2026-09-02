import React from 'react';
import { Eyebrow, Glass } from '../../../../design/primitives';
import type { NotificationDeliveryIssue } from '../../../../../types';
import { milestoneLabel } from '../../../viewer/milestones/milestoneViewModel';

export interface DeliveryIssuesCardProps {
  issues: NotificationDeliveryIssue[];
}

const KIND_LABEL: Record<NotificationDeliveryIssue['notificationKind'], string> = {
  winner: 'Winner email',
  correction_previous: 'Correction email (previous winner)',
  correction_current: 'Correction email (current winner)',
};

/** Nothing renders when there are no notification delivery issues to review. */
export default function DeliveryIssuesCard({ issues }: DeliveryIssuesCardProps) {
  if (!issues.length) return null;

  return (
    <Glass padding="lg" className="flex flex-col gap-3">
      <Eyebrow>Review delivery issue</Eyebrow>
      {issues.map((issue) => (
        <p key={issue.id} className="font-ui text-[14px] text-fg-2">
          {issue.milestone ? `${milestoneLabel(issue.milestone)} — ` : ''}
          {KIND_LABEL[issue.notificationKind]} failed after {issue.attemptCount} attempt{issue.attemptCount === 1 ? '' : 's'}
          {issue.error ? `: ${issue.error}` : '.'}
        </p>
      ))}
    </Glass>
  );
}
