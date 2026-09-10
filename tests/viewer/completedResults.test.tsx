import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CompletedResults, PayoutsAndRules } from '../../src/features/viewer/details/BoardDetailsDisclosure';
import type { GameState, WinnerResolution } from '../../types';

const game = { title: 'Test', topAbbr: 'SEA', leftAbbr: 'NE', payoutDescriptions: { Q1: '$100', HALF: '$100', FINAL: '$100' } } as GameState;
const winner: WinnerResolution = { milestone: 'Q1', sideDigit: 0, topDigit: 0, participantName: 'Demo Family', resolvedAt: '2026-09-10T01:00:00Z' };

describe('completed game milestones', () => {
  it('shows a published quarter winner without implying the game is final', () => {
    render(<CompletedResults game={game} winnerHistory={[winner]} />);
    const result = screen.getByRole('region', { name: 'Completed results' });
    expect(result).toHaveTextContent('Q1');
    expect(result).toHaveTextContent('Demo Family');
    expect(screen.queryByText('Final record')).not.toBeInTheDocument();
  });
  it('does not create a result when no milestone has been published', () => {
    render(<CompletedResults game={game} winnerHistory={[]} />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
  it('pairs payout milestones with published winners and unresolved status', () => {
    render(<PayoutsAndRules game={game} winnerHistory={[{ ...winner, milestone: 'Q2' }]} />);
    const region = screen.getByRole('region', { name: 'Payouts' });
    expect(within(region).getByText('Halftime').closest('div')).toHaveTextContent('Demo Family');
    expect(within(region).getByText('Q1').closest('div')).toHaveTextContent('Not yet confirmed');
  });
  it('labels an observed but unconfirmed payout as pending without naming a winner', () => {
    render(<PayoutsAndRules game={game} pendingMilestones={[{ milestone: 'Q1', sideScore: 0, topScore: 0, sideDigit: 0, topDigit: 0, stableSince: '2026-09-10T01:00:00Z', lastObservedAt: '2026-09-10T01:00:00Z', successfulReadCount: 1 }]} />);
    expect(screen.getByText('Q1').closest('div')).toHaveTextContent('Pending confirmation');
    expect(screen.queryByText('Demo Family')).not.toBeInTheDocument();
  });
  it('preserves open and corrected results', () => {
    render(<CompletedResults game={game} winnerHistory={[{ ...winner, participantName: null, openSquare: true, corrected: true, correctionReason: 'Score corrected' }]} />);
    expect(screen.getByRole('region')).toHaveTextContent('Open square');
    expect(screen.getByRole('region')).toHaveTextContent('Score corrected');
    expect(screen.queryByText('Demo Family')).not.toBeInTheDocument();
  });
});
