import React from 'react';
import type { BoardData, GameState, WinnerResolution } from '../../../../types';
import { Eyebrow, Glass } from '../../../design/primitives';
import { milestoneLabel } from '../milestones/milestoneViewModel';

export interface BoardDetailsDisclosureProps {
  game: GameState;
  board: BoardData;
  winnerHistory: WinnerResolution[];
  final: boolean;
}

export const FinalRecord: React.FC<{ winnerHistory: WinnerResolution[]; game: GameState }> = ({ winnerHistory, game }) => (
  <Glass as="section" padding="lg" className="flex flex-col gap-3 border-gold/40" role="region" aria-labelledby="final-record-title">
    <h2 id="final-record-title" className="font-display text-[26px] leading-[1.1] text-fg">Final record</h2>
    {winnerHistory.length ? (
      <ol className="flex flex-col gap-2">
        {winnerHistory.map((winner) => {
          const isOpenSquare = Boolean(winner.openSquare) && !winner.participantName;
          const notes = game.payoutDescriptions?.notes?.trim();
          return (
            <li key={`${winner.milestone}-${winner.resolvedAt}-${winner.resolutionVersion || 1}`} className="flex items-baseline justify-between gap-3">
              <span className="font-ui text-[15px] text-fg">
                <span className="font-medium">{milestoneLabel(winner.milestone)}</span> ·{' '}
                {isOpenSquare ? (
                  <>
                    Open square
                    {notes && (
                      <>
                        {' '}
                        <a href="#board-rules" className="underline underline-offset-2">see board rules</a>
                      </>
                    )}
                  </>
                ) : (
                  winner.participantName || (winner.openSquare ? 'Open square' : 'Unassigned')
                )}
              </span>
              <span className="font-mono tabular-nums text-[14px] text-fg-3">{winner.topDigit} across · {winner.sideDigit} down{winner.corrected ? ' · corrected' : ''}</span>
            </li>
          );
        })}
      </ol>
    ) : (
      <p className="font-ui text-[15px] text-fg-2">No resolved winner records have been published yet.</p>
    )}
  </Glass>
);

const PAYOUT_ROWS = [
  ['Q1', 'Q1'],
  ['HALF', 'Halftime'],
  ['Q3', 'Q3'],
  ['FINAL', 'Final'],
] as const;

export const PayoutsAndRules: React.FC<{ game: GameState }> = ({ game }) => {
  const rows = PAYOUT_ROWS.flatMap(([key, label]) => {
    const description = game.payoutDescriptions?.[key]?.trim();
    return description ? [{ key, label, description }] : [];
  });
  const notes = game.payoutDescriptions?.notes?.trim();

  if (!rows.length && !notes) return null;

  return (
    <Glass as="section" padding="lg" className="flex flex-col gap-3" id="board-rules" aria-labelledby="board-rules-title">
      <h2 id="board-rules-title" className="font-display text-[26px] leading-[1.1] text-fg">Payouts</h2>
      {rows.length > 0 && (
        <dl className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.key}>
              <dt><Eyebrow as="span">{row.label}</Eyebrow></dt>
              <dd className="font-ui text-[15px] text-fg mt-1">{row.description}</dd>
            </div>
          ))}
        </dl>
      )}
      {notes && (
        <div>
          <Eyebrow as="span">Board rules</Eyebrow>
          <p className="font-ui text-[15px] text-fg mt-1">{notes}</p>
        </div>
      )}
      <p className="font-ui text-[13px] text-fg-3">
        GridOne tracks the board. It does not collect square money or pay winners.
      </p>
    </Glass>
  );
};

const BoardDetailsDisclosure: React.FC<BoardDetailsDisclosureProps> = ({ game, board, winnerHistory, final }) => (
  <section className="flex flex-col gap-4" aria-labelledby="board-details-title">
    {final && <FinalRecord winnerHistory={winnerHistory} game={game} />}
    <PayoutsAndRules game={game} />
    <details className="group rounded-card border border-hairline p-3">
      <summary id="board-details-title" className="min-h-11 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden font-ui text-[15px] text-fg">
        <span>Board details</span>
        <span aria-hidden="true" className="font-mono text-fg-3 group-open:hidden">+</span>
        <span aria-hidden="true" className="font-mono text-fg-3 hidden group-open:inline">−</span>
      </summary>
      <dl className="mt-3 flex flex-col gap-3">
        <div><dt><Eyebrow as="span">Teams</Eyebrow></dt><dd className="font-ui text-[15px] text-fg">{game.leftName || game.leftAbbr} at {game.topName || game.topAbbr}</dd></div>
        <div><dt><Eyebrow as="span">Squares assigned</Eyebrow></dt><dd className="font-mono tabular-nums text-[15px] text-fg">{board.squares.filter((names) => names.length > 0).length} of 100</dd></div>
        <div><dt><Eyebrow as="span">Digits</Eyebrow></dt><dd className="font-ui text-[15px] text-fg-2">Top axis and side axis use organizer-published digits.</dd></div>
      </dl>
    </details>
  </section>
);

export default BoardDetailsDisclosure;
