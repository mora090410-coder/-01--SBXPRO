import React, { useMemo, useRef, useState } from 'react';
import type { BoardData, GameState } from '../../../../types';
import { Base, CapsuleButton, Eyebrow, Glass } from '../../../design/primitives';

export interface SalesBoardViewerProps {
  game: GameState;
  board: BoardData;
  updatedAt?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  error?: string | null;
  organizerHref?: string;
}

/** A public selling record. Cell numbers identify positions; they are not game digits. */
export default function SalesBoardViewer({ game, board, updatedAt, onRefresh, refreshing = false, error, organizerHref }: SalesBoardViewerProps) {
  const [family, setFamily] = useState('');
  const [unsoldOnly, setUnsoldOnly] = useState(false);
  const [focused, setFocused] = useState(0);
  const refs = useRef<Array<HTMLDivElement | null>>([]);
  const cells = useMemo(() => Array.from({ length: 100 }, (_, index) => {
    const names = (board.squares[index] || []).map(name => name.trim()).filter(Boolean);
    return { index, number: index + 1, buyer: names.join(', ') || 'Unsold', unsold: names.length === 0, family: board.allocationLabels?.[index]?.trim() || '' };
  }), [board]);
  const families = [...new Set(cells.map(cell => cell.family).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const visibleFamily = families.includes(family) ? family : '';
  const matches = (cell: typeof cells[number]) => (!visibleFamily || cell.family === visibleFamily) && (!unsoldOnly || cell.unsold);
  const details = cells.filter(matches);
  const sold = cells.filter(cell => !cell.unsold).length;
  const selected = cells[focused];
  const timestamp = updatedAt ? new Date(updatedAt) : null;
  const updatedLabel = timestamp && !Number.isNaN(timestamp.getTime()) ? `Last updated ${timestamp.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : 'Update time unavailable';

  const moveFocus = (event: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    const row = Math.floor(index / 10);
    let next = index;
    switch (event.key) {
      case 'ArrowRight': next = Math.min(row * 10 + 9, index + 1); break;
      case 'ArrowLeft': next = Math.max(row * 10, index - 1); break;
      case 'ArrowDown': next = Math.min(99, index + 10); break;
      case 'ArrowUp': next = Math.max(0, index - 10); break;
      case 'Home': next = event.ctrlKey ? 0 : row * 10; break;
      case 'End': next = event.ctrlKey ? 99 : row * 10 + 9; break;
      default: return;
    }
    event.preventDefault();
    setFocused(next);
    refs.current[next]?.focus();
  };

  return (
    <Base kind="dark">
      <main aria-label={`${game.title || 'GridOne board'} selling board`} className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6 md:py-12">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>Selling squares</Eyebrow>
            {organizerHref && <a href={organizerHref} className="inline-flex min-h-11 items-center rounded-control px-3 font-ui text-sm text-fg underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">Manage board</a>}
          </div>
          <h1 className="font-display text-[40px] leading-none text-fg md:text-[56px]">{game.title || 'GridOne board'}</h1>
          <p className="font-ui text-base text-fg-2">{game.leftName || game.leftAbbr} at {game.topName || game.topAbbr}{game.dates ? ` · ${game.dates}` : ''}</p>
          <div className="flex flex-col gap-1">
            <p className="font-ui text-lg text-fg">Numbers will be drawn before the game.</p>
            <p className="font-ui text-sm text-fg-2">The organizer updates buyer names. Share square numbers with your family or organizer to arrange a purchase.</p>
          </div>
        </header>

        <Glass padding="lg" className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3"><span className="font-display text-[40px] leading-none text-fg">{sold}<span className="text-fg-3"> / 100</span></span><span className="font-ui text-sm text-fg-2">sold · {100 - sold} unsold</span></div>
          <div className="flex flex-wrap items-center gap-3">
            <p role="status" className="font-mono text-xs text-fg-2">{updatedLabel}</p>
            {onRefresh && <CapsuleButton variant="quiet" onClick={onRefresh} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh board'}</CapsuleButton>}
          </div>
        </Glass>
        {error && <p role="alert" className="font-ui text-sm text-fg">{error}</p>}

        <section aria-label="Find family squares" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-0 flex-1 flex-col gap-2 font-ui text-sm text-fg md:max-w-xs">
              Family
              <select aria-label="Family" value={visibleFamily} onChange={event => setFamily(event.target.value)} className="min-h-11 w-full rounded-control border border-hairline bg-panel px-3 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">
                <option value="">All families</option>
                {families.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <CapsuleButton variant="quiet" aria-pressed={unsoldOnly} onClick={() => setUnsoldOnly(value => !value)}>Highlight unsold</CapsuleButton>
          </div>
          <p role="status" className="font-ui text-sm text-fg-2">{details.length} {details.length === 1 ? 'square' : 'squares'}{visibleFamily ? ` for ${visibleFamily}` : ' across all families'}{unsoldOnly ? ' · unsold' : ''}. The full board stays visible.</p>
        </section>

        <div className="flex min-w-0 flex-col gap-6">
        <section aria-label="Square details" className="order-1 flex flex-col gap-3 md:order-2">
          <p role="status" aria-label="Selected square" className="min-h-11 rounded-control bg-panel p-3 font-ui text-sm text-fg">Square {selected.number} · {selected.buyer} · {selected.family || 'No family assigned'}</p>
          <details open={Boolean(visibleFamily || unsoldOnly) || undefined}>
            <summary className="flex min-h-11 cursor-pointer items-center rounded-control font-ui text-base text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">Square details · {details.length} {details.length === 1 ? 'square' : 'squares'} <span aria-hidden="true" className="ml-2">↓</span></summary>
            <p className="pb-3 font-ui text-sm text-fg-2">Full buyer and family names for every matching square.</p>
            {details.length === 0 ? <p className="font-ui text-sm text-fg-2">No squares match these filters.</p> : <ul className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2 md:max-h-none lg:grid-cols-3">{details.map(cell => <li key={cell.number} className="flex min-w-0 flex-col gap-1 rounded-control border border-hairline bg-panel p-3">
              <span className="font-mono text-xs text-fg-3">Square {cell.number}</span>
              <span className="break-words font-ui text-base text-fg">{cell.buyer}</span>
              <span className="break-words font-ui text-sm text-fg-2">{cell.family || 'No family assigned'}</span>
            </li>)}</ul>}
          </details>
        </section>

        <section aria-label="Board" className="order-2 flex min-w-0 flex-col gap-3 md:order-1">
          <div className="flex flex-col gap-1"><h2 className="font-display text-[28px] text-fg">The board</h2><p id="sales-board-help" className="font-ui text-sm text-fg-2">1–100 identifies each square. Tap a square for full details. Use arrow keys to move through the board.</p></div>
          <p className="font-ui text-sm text-fg-2 md:hidden">✓ Sold · No checkmark means unsold</p>
          <div className="w-full rounded-control border border-hairline">
            <div role="grid" aria-label="Selling squares board, 100 squares" aria-describedby="sales-board-help" aria-rowcount={10} aria-colcount={10} className="w-full">
              {Array.from({ length: 10 }, (_, row) => <div role="row" key={row} className="grid grid-cols-10">
                {cells.slice(row * 10, row * 10 + 10).map(cell => <div
                  key={cell.index}
                  role="gridcell"
                  aria-label={`Square ${cell.number}, ${cell.buyer}, ${cell.family || 'No family assigned'}`}
                  tabIndex={focused === cell.index ? 0 : -1}
                  ref={element => { refs.current[cell.index] = element; }}
                  onFocus={() => setFocused(cell.index)}
                  onClick={() => { setFocused(cell.index); refs.current[cell.index]?.focus(); }}
                  onKeyDown={event => moveFocus(event, cell.index)}
                  className={`relative flex aspect-square min-w-0 cursor-pointer flex-col items-center justify-center gap-1 border-b border-r border-hairline p-0.5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold md:aspect-auto md:min-h-28 md:items-stretch md:justify-start md:p-2 ${matches(cell) && (visibleFamily || unsoldOnly) ? 'bg-panel-hover ring-1 ring-inset ring-gold' : 'bg-panel'} ${!matches(cell) ? 'text-fg-3' : 'text-fg'}`}
                >
                  <span className="font-mono text-xs md:text-fg-3">{cell.number}</span>
                  {!cell.unsold && <span aria-hidden="true" className="absolute right-0.5 top-0 font-ui text-[9px] md:hidden">✓</span>}
                  <span className="hidden truncate font-ui text-sm md:block">{cell.buyer}</span>
                  <span className="hidden truncate font-ui text-[11px] text-fg-2 md:block">{cell.family || 'Unassigned'}</span>
                </div>)}
              </div>)}
            </div>
          </div>
        </section>
        </div>
      </main>
    </Base>
  );
}
