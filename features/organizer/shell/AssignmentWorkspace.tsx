import React from 'react';
import type { BoardData, GameState } from '../../../types';
export default function AssignmentWorkspace({ board, game }: { board: BoardData; game: GameState }) {
  return <section role="region" aria-label="Assignment workspace" className="grid gap-4"><h2 className="text-2xl font-semibold">Fill the board</h2><p className="text-ink/70">Dominant artifact: assignment board for {game.title || 'this board'}.</p><div className="max-w-full overflow-auto overscroll-contain border border-ink" data-testid="contained-board-overflow"><div className="grid min-w-[640px] grid-cols-10">{board.squares.map((names, index) => <div key={index} className="min-h-11 border border-newsprint p-2 text-xs">{names[0] || 'OPEN'}</div>)}</div></div></section>;
}
