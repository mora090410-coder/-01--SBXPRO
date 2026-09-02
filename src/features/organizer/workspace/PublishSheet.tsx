import React from 'react';
import { Sheet, CapsuleButton, CapsuleTag } from '../../../design/primitives';
import type { BoardData, GameState } from '../../../../types';

export interface PublishSheetProps {
  open: boolean;
  onClose: () => void;
  game: GameState;
  board: BoardData;
  allowance?: { tier: string; used: number; allowance: number } | null;
  pending: boolean;
  error: string | null;
  disabled: boolean;
  onPublish: () => void;
}

const TIER_LABEL: Record<string, string> = {
  gameday: 'Game Day',
  org: 'Organization',
  free: 'Free',
};

const tierLabel = (tier: string) => TIER_LABEL[tier] ?? `${tier.charAt(0).toUpperCase()}${tier.slice(1)}`;

/** Confirmation summary shown before a board's viewer link goes live. */
export default function PublishSheet({ open, onClose, game, board, allowance, pending, error, disabled, onPublish }: PublishSheetProps) {
  const assigned = board.squares.filter((s) => s.length).length;
  const open_ = 100 - assigned;

  return (
    <Sheet open={open} onClose={onClose} title="Publish viewer link">
      <div className="flex flex-col gap-5">
        <CapsuleButton type="button" variant="quiet" disabled={pending} onClick={onClose} className="self-start">
          Cancel
        </CapsuleButton>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-ui text-[15px] text-fg">
          <dt className="text-fg-3">Board name</dt>
          <dd>{game.title}</dd>
          <dt className="text-fg-3">Matchup</dt>
          <dd>{game.leftAbbr} at {game.topAbbr}</dd>
          <dt className="text-fg-3">Kickoff</dt>
          <dd>{game.dates}</dd>
          <dt className="text-fg-3">Squares</dt>
          <dd>{assigned} assigned · {open_} OPEN</dd>
          <dt className="text-fg-3">Top axis</dt>
          <dd className="font-mono">{board.topAxis.map((n) => (n ?? '—')).join(' ')}</dd>
          <dt className="text-fg-3">Side axis</dt>
          <dd className="font-mono">{board.leftAxis.map((n) => (n ?? '—')).join(' ')}</dd>
        </dl>

        {open_ > 0 && (
          <p className="font-ui text-[14px] text-fg-2">Open squares stay OPEN on the shared board.</p>
        )}

        <div className="flex flex-col gap-1">
          <h3 className="font-ui text-[14px] font-medium text-fg">What becomes public</h3>
          <p className="font-ui text-[14px] text-fg-2">Board name, matchup, axis digits, square labels, OPEN squares, payout/rules descriptions, and correction history.</p>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-ui text-[14px] font-medium text-fg">What remains private</h3>
          <p className="font-ui text-[14px] text-fg-2">Payment status, seller attribution, contact details, and organizer notes.</p>
        </div>

        {allowance && (
          <CapsuleTag>{allowance.used} of {allowance.allowance} published this season · {tierLabel(allowance.tier)}</CapsuleTag>
        )}

        {error && (
          <p role="alert" className="font-ui text-[14px] text-tone-cardinal">{error}</p>
        )}

        <div className="flex justify-end">
          <CapsuleButton type="button" disabled={disabled || pending} aria-busy={pending} onClick={onPublish}>
            {pending ? 'Publishing…' : 'Publish viewer link'}
          </CapsuleButton>
        </div>
      </div>
    </Sheet>
  );
}
