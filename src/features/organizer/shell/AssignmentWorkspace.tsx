import React from 'react';
import type { BoardData, GameState } from '../../../../types';

export default function AssignmentWorkspace({
  board,
  game,
  published = false,
  canAssignOpenSquares = false,
  selectedOpenSquare = null,
  assignmentLabel = '',
  pending = false,
  onSelectOpenSquare,
  onAssignmentLabelChange,
  onAssignOpenSquare,
}: {
  board: BoardData;
  game: GameState;
  published?: boolean;
  canAssignOpenSquares?: boolean;
  selectedOpenSquare?: number | null;
  assignmentLabel?: string;
  pending?: boolean;
  onSelectOpenSquare?: (index: number) => void;
  onAssignmentLabelChange?: (label: string) => void;
  onAssignOpenSquare?: () => void;
}) {
  const assignDisabled = !published || !canAssignOpenSquares || selectedOpenSquare === null || !assignmentLabel.trim() || pending;
  return (
    <section role="region" aria-label="Fill the board" className="grid min-w-0 max-w-full gap-4">
      <h2 className="text-2xl font-semibold">Fill the board</h2>
      <p className="text-ink/70">Add the names you sold squares to for {game.title || 'this board'}.</p>
      {published && (
        <div className="grid gap-2 border border-newsprint p-3">
          <h3 className="text-lg font-semibold">Late OPEN-square assignment</h3>
          <p>{canAssignOpenSquares ? 'OPEN squares can be assigned until kickoff.' : 'OPEN-square assignment is closed after kickoff or when no OPEN squares remain.'}</p>
          <label className="grid gap-1 text-sm">
            <span>Purchaser label</span>
            <input className="oa-input" value={assignmentLabel} onChange={(event) => onAssignmentLabelChange?.(event.target.value)} disabled={!canAssignOpenSquares || pending} />
          </label>
          <button type="button" className="oa-btn oa-btn-primary justify-self-start" disabled={assignDisabled} aria-busy={pending} onClick={onAssignOpenSquare}>
            {pending ? 'Assigning OPEN square…' : 'Assign selected OPEN square'}
          </button>
        </div>
      )}
      <div className="w-full min-w-0 max-w-full overflow-auto overscroll-contain border border-ink" style={{ contain: 'inline-size' }} data-testid="contained-board-overflow">
        <div className="grid min-w-[640px] grid-cols-10">
          {board.squares.map((names, index) => {
            const isOpen = !names.length;
            const selectable = published && canAssignOpenSquares && isOpen;
            return (
              <button
                type="button"
                key={index}
                className={`min-h-11 border border-newsprint p-2 text-xs text-left ${selectedOpenSquare === index ? 'bg-gold/30' : ''}`}
                disabled={!selectable || pending}
                onClick={() => onSelectOpenSquare?.(index)}
                aria-pressed={selectedOpenSquare === index}
              >
                <span className="sr-only">Square {index + 1}: </span>{names[0] || 'OPEN'}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
