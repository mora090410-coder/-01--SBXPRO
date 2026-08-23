import React, { useEffect, useRef } from 'react';
import type { BoardData, GameState } from '../../../../types';

export default function PublishReviewDialog({
  open,
  game,
  board,
  pending = false,
  error = null,
  disabled = false,
  onClose,
  onPublish,
}: {
  open: boolean;
  game: GameState;
  board: BoardData;
  pending?: boolean;
  error?: string | null;
  disabled?: boolean;
  onClose: () => void;
  onPublish: () => void | Promise<void>;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;
  const assigned = board.squares.filter((s) => s.length).length;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="publish-review-title" className="fixed inset-0 z-[100] grid place-items-center bg-ink/70 p-4">
      <section className="max-w-xl bg-broadcast-white p-5 text-ink">
        <h2 id="publish-review-title" className="text-2xl font-semibold">Publish viewer link</h2>
        <p>{game.title} · {game.leftAbbr} at {game.topAbbr}</p>
        <p>{assigned} assigned · {100 - assigned} OPEN</p>
        <h3>What becomes public</h3>
        <p>Board name, matchup, axis digits, square labels, OPEN squares, payout/rules descriptions, and correction history.</p>
        <h3>What remains private</h3>
        <p>Payment status, seller attribution, contact details, and organizer notes.</p>
        {error && <p role="alert" className="text-cardinal">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button ref={closeRef} type="button" className="oa-btn" disabled={pending} onClick={onClose}>Cancel</button>
          <button type="button" className="oa-btn oa-btn-primary" disabled={disabled || pending} onClick={onPublish}>{pending ? 'Publishing…' : 'Publish viewer link'}</button>
        </div>
      </section>
    </div>
  );
}
