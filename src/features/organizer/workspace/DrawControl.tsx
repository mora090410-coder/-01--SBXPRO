import React from 'react';
import { Glass, CapsuleButton, CapsuleTag } from '../../../design/primitives';

export interface DrawControlProps {
  openCount: number;
  acknowledged: boolean;
  drawn: boolean;
  preview: boolean;
  disabled: boolean;
  onAcknowledge: () => void;
  onKeepAssigning: () => void;
  onDraw: () => void;
  onCommit: () => void;
  onAgain: () => void;
  onReplace: () => void;
  onCancelPreview: () => void;
}

/**
 * Glass panel rendered by the workspace only when relevant: the open-square
 * acknowledgement, the preview-numbers review, or the drawn-draft summary.
 */
export default function DrawControl({
  openCount,
  acknowledged,
  drawn,
  preview,
  disabled,
  onAcknowledge,
  onKeepAssigning,
  onCommit,
  onAgain,
  onReplace,
  onCancelPreview,
}: DrawControlProps) {
  if (preview) {
    return (
      <Glass className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <CapsuleButton variant="primary" onClick={onCommit} disabled={disabled}>Use these numbers</CapsuleButton>
          <CapsuleButton variant="quiet" onClick={onAgain} disabled={disabled}>Draw again</CapsuleButton>
          <CapsuleButton variant="ghost" onClick={onCancelPreview} disabled={disabled}>Cancel</CapsuleButton>
        </div>
      </Glass>
    );
  }

  if (drawn) {
    return (
      <Glass className="flex items-center gap-3">
        <span className="font-mono text-[14px] text-fg">Numbers set</span>
        <CapsuleTag tone="gold">Drawn</CapsuleTag>
        <CapsuleButton variant="ghost" onClick={onReplace} disabled={disabled}>Replace draft draw</CapsuleButton>
      </Glass>
    );
  }

  if (openCount > 0 && !acknowledged) {
    const heading = `${openCount} squares are open. Draw anyway?`;
    return (
      <Glass role="group" aria-label={heading} className="flex flex-col gap-3">
        <h2 className="font-display text-[20px] leading-[1.1] text-fg">{heading}</h2>
        <p className="font-ui text-[14px] text-fg-2">
          Open squares stay marked OPEN on the shared board. You can still assign them before kickoff.
        </p>
        <div className="flex flex-wrap gap-2">
          <CapsuleButton variant="quiet" onClick={onKeepAssigning} disabled={disabled}>Keep assigning</CapsuleButton>
          <CapsuleButton variant="primary" onClick={onAcknowledge} disabled={disabled}>{`Draw with ${openCount} OPEN`}</CapsuleButton>
        </div>
      </Glass>
    );
  }

  return null;
}
