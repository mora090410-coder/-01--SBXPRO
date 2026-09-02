import React, { useEffect, useState } from 'react';
import { Sheet } from '../../../design/primitives/Sheet';
import { CapsuleButton, CapsuleInput, CapsuleTag } from '../../../design/primitives';
import type { EntryMeta } from '../../../../types';

export interface SquareSheetProps {
  open: boolean;
  index: number | null;
  name: string;
  meta?: EntryMeta;
  isPublished: boolean;
  hasNextOpen: boolean;
  onSave: (index: number, name: string, meta: EntryMeta, advance: boolean) => void;
  onClose: () => void;
}

const PUBLISHED_HELPER = 'This board is published. Renaming a square is recorded in the board history and updates the shared link right away.';

/** Bottom sheet for assigning a name, seller, and paid status to one square. */
export default function SquareSheet({ open, index, name, meta, isPublished, hasNextOpen, onSave, onClose }: SquareSheetProps) {
  const [nameValue, setNameValue] = useState(name);
  const [sellerValue, setSellerValue] = useState(meta?.seller_label ?? '');
  const [paidStatus, setPaidStatus] = useState<'unpaid' | 'paid'>(meta?.paid_status === 'paid' ? 'paid' : 'unpaid');

  useEffect(() => {
    if (!open) return;
    setNameValue(name);
    setSellerValue(meta?.seller_label ?? '');
    setPaidStatus(meta?.paid_status === 'paid' ? 'paid' : 'unpaid');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  if (!open) return null;

  const buildMeta = (): EntryMeta => ({
    cell_index: index ?? 0,
    paid_status: paidStatus,
    notify_opt_in: meta?.notify_opt_in ?? false,
    contact_type: meta?.contact_type ?? null,
    contact_value: meta?.contact_value ?? null,
    seller_label: sellerValue.trim() || null,
  });

  const showSaveAndNext = hasNextOpen && !isPublished;

  const save = (advance: boolean) => {
    if (index === null) return;
    onSave(index, nameValue, buildMeta(), advance);
  };

  const onNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    save(showSaveAndNext);
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Square ${(index ?? 0) + 1}`}>
      <div className="flex flex-col gap-5">
        {isPublished && <p className="font-ui text-[14px] text-fg-2">{PUBLISHED_HELPER}</p>}
        <CapsuleInput
          label="Name on the board"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          onKeyDown={onNameKeyDown}
          autoFocus
        />
        <CapsuleInput
          label="Sold by (optional)"
          value={sellerValue}
          onChange={(event) => setSellerValue(event.target.value)}
        />
        <div className="flex flex-col gap-2">
          <span className="font-ui text-[14px] text-fg-2">Payment</span>
          <div role="radiogroup" aria-label="Payment" className="flex gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={paidStatus === 'unpaid'}
              onClick={() => setPaidStatus('unpaid')}
            >
              <CapsuleTag tone={paidStatus === 'unpaid' ? 'cardinal' : 'neutral'}>Unpaid</CapsuleTag>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={paidStatus === 'paid'}
              onClick={() => setPaidStatus('paid')}
            >
              <CapsuleTag tone={paidStatus === 'paid' ? 'gold' : 'neutral'}>Paid</CapsuleTag>
            </button>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <CapsuleButton variant="quiet" onClick={() => save(false)}>Save</CapsuleButton>
          {showSaveAndNext && <CapsuleButton onClick={() => save(true)}>Save and next</CapsuleButton>}
        </div>
      </div>
    </Sheet>
  );
}
