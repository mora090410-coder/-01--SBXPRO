import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import YourSquaresSummary from '../../src/features/viewer/personal/YourSquaresSummary';
import ScenarioDisclosure from '../../src/features/viewer/scenarios/ScenarioDisclosure';
import BoardDetailsDisclosure from '../../src/features/viewer/details/BoardDetailsDisclosure';
import type { BoardData, GameState, LiveGameData, WinnerResolution } from '../../types';

const board: BoardData = { topAxis: [0,1,2,3,4,5,6,7,8,9], leftAxis: [0,1,2,3,4,5,6,7,8,9], squares: Array.from({ length: 100 }, () => []), participants: [{ id: 'p', displayName: 'Carrie Moss', publicLabel: 'Carrie Moss' }] };
board.squares[14] = ['Carrie Moss'];
board.squares[34] = ['Carrie Moss'];
const game: GameState = { title: 'GridOne Bowl', meta: '', leftAbbr: 'KC', leftName: 'Kansas City', topAbbr: 'PHI', topName: 'Philadelphia', dates: 'Sep 13', lockTitle: false, lockMeta: false };
const live: LiveGameData = { leftScore: 21, topScore: 14, quarterScores: { Q1: { left: 7, top: 0 }, Q2: { left: 7, top: 7 }, Q3: { left: 7, top: 7 }, Q4: { left: 0, top: 0 }, OT: { left: 0, top: 0 } }, clock: '8:12', period: 3, state: 'in', detail: '3rd quarter', isOvertime: false, sourceName: 'ESPN', retrievedAt: '2026-09-13T20:15:00.000Z', staleAfter: '2026-09-13T20:16:00.000Z', freshness: 'fresh' };

describe('YourSquaresSummary', () => {
  it('lists every square as a mono chip and says who wins now in gold', () => {
    const onViewSquare = vi.fn();
    render(<YourSquaresSummary board={board} game={game} live={live} selectedPlayer="Carrie Moss" onViewSquare={onViewSquare} />);
    const region = screen.getByRole('region', { name: 'Carrie Moss square summary' });
    expect(within(region).getByText('2 squares')).toBeInTheDocument();
    const winsNow = within(region).getByText('Current result matches now.');
    expect(winsNow.className).toContain('text-gold');
    fireEvent.click(within(region).getByRole('button', { name: /View on board top 4 side 1/ }));
    expect(onViewSquare).toHaveBeenCalledWith({ top: 4, left: 1 });
    expect(within(region).getByText(/Next score: KC Safety \+2/)).toBeInTheDocument();
  });
});

describe('ScenarioDisclosure', () => {
  it('keeps matching scenarios first and the rest behind a closed disclosure', () => {
    render(<ScenarioDisclosure board={board} game={game} live={live} selectedPlayer="Carrie Moss" servicesEnabled onScenarioFocus={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'What score changes the next result?' })).toBeInTheDocument();
    const details = screen.getByText('All possible next scores').closest('details');
    expect(details?.open).toBe(false);
    expect(screen.getByText('These are arithmetic score outcomes, not odds or predictions.')).toBeInTheDocument();
  });
});

describe('BoardDetailsDisclosure', () => {
  it('names milestones in the final record', () => {
    const history: WinnerResolution[] = [{ milestone: 'Q2', sideScore: 14, topScore: 7, sideDigit: 4, topDigit: 7, participantName: 'Carrie Moss', resolvedAt: '2026-09-13T21:00:00.000Z' }];
    render(<BoardDetailsDisclosure game={game} board={board} winnerHistory={history} final />);
    expect(screen.getByRole('heading', { name: 'Final record' })).toBeInTheDocument();
    expect(screen.getByText(/Halftime/)).toBeInTheDocument();
    expect(screen.getByText('Board details')).toBeInTheDocument();
  });
});
