import React from 'react';
import { Sheet, CapsuleButton } from '../../../design/primitives';

export interface PreviewSheetProps {
  open: boolean;
  onClose: () => void;
  canPublish: boolean;
  onReviewPublish: () => void;
  children: React.ReactNode;
}

/** Full-height private preview of the board before it is shared. */
export default function PreviewSheet({ open, onClose, canPublish, onReviewPublish, children }: PreviewSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Private preview — sharing is off" height="full">
      <div className="flex flex-col h-full gap-4">
        <div data-testid="preview-scroll" className="flex-1 overflow-y-auto">
          {children}
        </div>
        <div className="sticky bottom-0 pt-3 flex justify-end">
          <CapsuleButton type="button" disabled={!canPublish} onClick={onReviewPublish}>
            Review and publish
          </CapsuleButton>
        </div>
      </div>
    </Sheet>
  );
}
