import React, { useState } from 'react';
import { Glass, CapsuleTag } from '../../../design/primitives';
import type { BoardData, EntryMeta, GameState } from '../../../../types';

export interface BoardEditorProps {
  board: BoardData;
  game: GameState;
  entryMeta: Record<number, EntryMeta>;
  /** Digits animating into the axes for a draft draw preview. */
  drawPreview: { top: number[]; left: number[] } | null;
  highlightOpen: boolean;
  isPublished: boolean;
  /** Published only: when true, open squares stay selectable for late fill. */
  canAssignOpenSquares: boolean;
  onSelectSquare: (index: number) => void;
  /** Draft only: paste a newline-separated name list into the first open cells. */
  onPasteNames?: (names: string[]) => void;
}

const AXIS_CELL = 'flex items-center justify-center min-h-11 h-11 bg-chyron text-gold font-mono text-[13px] rounded-cell';
const PREVIEW_ANIM = 'animate-[digit-roll_var(--g-dur-spring)_var(--g-ease-state)]';

function splitNames(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Organizer board editor: 11x11 grid with square assignment and a draft draw preview. */
export default function BoardEditor({
  board,
  entryMeta,
  drawPreview,
  highlightOpen,
  isPublished,
  canAssignOpenSquares,
  onSelectSquare,
  onPasteNames,
}: BoardEditorProps) {
  const [pasteValue, setPasteValue] = useState('');

  const topDigits = drawPreview ? drawPreview.top : board.topAxis;
  const leftDigits = drawPreview ? drawPreview.left : board.leftAxis;

  const flushPasteValue = (value: string) => {
    if (!onPasteNames) return;
    const names = splitNames(value);
    if (names.length) {
      onPasteNames(names);
      setPasteValue('');
    }
  };

  const isCellDisabled = (isOpen: boolean) => {
    if (!isPublished) return false;
    if (isOpen) return !canAssignOpenSquares;
    return false;
  };

  return (
    <div className="flex flex-col gap-3">
      {drawPreview && <CapsuleTag tone="gold">Draft draw</CapsuleTag>}
      {onPasteNames && (
        <textarea
          aria-label="Paste names"
          value={pasteValue}
          onChange={(event) => setPasteValue(event.target.value)}
          onPaste={(event) => {
            const el = event.currentTarget;
            setTimeout(() => flushPasteValue(el.value), 0);
          }}
          onBlur={(event) => flushPasteValue(event.currentTarget.value)}
          className="w-full min-h-[80px] rounded-card border border-hairline bg-panel p-3 font-ui text-[14px] text-fg placeholder:text-fg-3 outline-none focus-visible:border-action"
          placeholder="Paste one name per line"
        />
      )}
      <div data-testid="contained-board-overflow" className="overflow-auto rounded-card border border-hairline">
        <div className="min-w-[640px]">
          <Glass padding="md">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: 'repeat(11, minmax(44px, 1fr))' }}
            >
              <div className={AXIS_CELL} aria-hidden="true" />
              {topDigits.map((digit, colIndex) => (
                <div key={`top-${colIndex}`} className={`${AXIS_CELL} ${drawPreview ? PREVIEW_ANIM : ''}`.trim()}>
                  {digit === null || digit === undefined ? '·' : digit}
                </div>
              ))}
              {Array.from({ length: 10 }, (_, rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                  <div className={`${AXIS_CELL} ${drawPreview ? PREVIEW_ANIM : ''}`.trim()}>
                    {leftDigits[rowIndex] === null || leftDigits[rowIndex] === undefined ? '·' : leftDigits[rowIndex]}
                  </div>
                  {Array.from({ length: 10 }, (_, colIndex) => {
                    const index = rowIndex * 10 + colIndex;
                    const names = board.squares[index] ?? [];
                    const isOpen = names.length === 0;
                    const name = names[0];
                    const paid = entryMeta[index]?.paid_status === 'paid';
                    const disabled = isCellDisabled(isOpen);
                    const label = isOpen ? `Square ${index + 1}, unassigned` : `Square ${index + 1}, assigned to ${name}`;
                    const openClasses = 'bg-transparent border border-dashed border-hairline text-fg-3';
                    const assignedClasses = 'bg-panel text-fg';
                    const highlightClasses = highlightOpen && isOpen ? 'ring-2 ring-tone-cardinal' : '';
                    return (
                      <button
                        key={index}
                        type="button"
                        aria-label={label}
                        disabled={disabled}
                        onClick={() => onSelectSquare(index)}
                        className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-cell px-1 py-1 font-ui text-[12px] transition-[background-color] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action ${isOpen ? openClasses : assignedClasses} ${highlightClasses}`.trim()}
                      >
                        {!isOpen && <span className="line-clamp-2 text-center leading-tight">{name}</span>}
                        {paid && <span className="font-mono text-[10px] text-fg-2">paid</span>}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </Glass>
        </div>
      </div>
    </div>
  );
}
