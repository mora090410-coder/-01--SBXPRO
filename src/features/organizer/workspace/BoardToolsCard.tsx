import React, { useEffect, useRef, useState } from 'react';
import { Eyebrow, CapsuleButton, Glass } from '../../../design/primitives';

export interface BoardToolsCardProps {
  isPublished: boolean;
  exporting: boolean;
  onExport: (mode: 'owners' | 'sellers') => void;
  hasSellers: boolean;
  onImportPhoto?: (file: File) => void;
  importing?: boolean;
  onClearNames?: () => void;
}

const CONFIRM_WINDOW_MS = 5000;

export default function BoardToolsCard({
  isPublished,
  exporting,
  onExport,
  hasSellers,
  onImportPhoto,
  importing = false,
  onClearNames,
}: BoardToolsCardProps) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
  }, []);

  const handleClearClick = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      confirmTimer.current = setTimeout(() => setConfirmingClear(false), CONFIRM_WINDOW_MS);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmingClear(false);
    onClearNames?.();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImportPhoto?.(file);
    e.target.value = '';
  };

  return (
    <Glass padding="lg" className="flex flex-col gap-3">
      <Eyebrow>Board tools</Eyebrow>
      <div className="flex flex-col gap-2">
        <CapsuleButton variant="quiet" size="md" disabled={exporting} onClick={() => onExport('owners')}>
          Send board
        </CapsuleButton>
        {hasSellers && (
          <CapsuleButton variant="quiet" size="md" disabled={exporting} onClick={() => onExport('sellers')}>
            Send seller sheet
          </CapsuleButton>
        )}
        {!isPublished && (
          <label className="inline-flex items-center justify-center gap-2 rounded-capsule h-11 px-5 text-[15px] bg-panel border border-hairline text-fg font-ui cursor-pointer">
            Import a paper board photo
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              disabled={importing}
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        )}
        {!isPublished && onClearNames && (
          <CapsuleButton variant="ghost" size="md" onClick={handleClearClick}>
            {confirmingClear ? 'Confirm clear' : 'Clear all names'}
          </CapsuleButton>
        )}
      </div>
    </Glass>
  );
}
