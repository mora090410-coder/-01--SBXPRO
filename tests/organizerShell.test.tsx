import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OrganizerShell from '../src/features/organizer/shell/OrganizerShell';
import type { BoardData, GameState, WinnerResolution } from '../types';
import { enableManualScoringOnServer, returnAutomaticScoringOnServer, saveManualScoreToServer } from '../src/features/organizer/services/game-day/manualScoreService';
import { publishMilestoneCorrectionToServer } from '../src/features/organizer/services/corrections/milestoneCorrectionService';

vi.mock('../src/features/organizer/services/game-day/manualScoreService', () => ({
  enableManualScoringOnServer: vi.fn(async () => ({})),
  saveManualScoreToServer: vi.fn(async () => ({ score: { leftScore: 3, topScore: 7, quarterScores: { Q1: { left: 3, top: 7 }, Q2: { left: 0, top: 0 }, Q3: { left: 0, top: 0 }, Q4: { left: 0, top: 0 }, OT: { left: 0, top: 0 } }, clock: '0:00', period: 1, state: 'in', detail: 'Manual', isOvertime: false } })),
  returnAutomaticScoringOnServer: vi.fn(async () => ({})),
}));
vi.mock('../src/features/organizer/services/corrections/milestoneCorrectionService', () => ({
  publishMilestoneCorrectionToServer: vi.fn(async (_poolId, draft) => ({ winnerHistory: [{ milestone: draft.milestone, sideScore: draft.sideScore, topScore: draft.topScore, sideDigit: draft.sideScore % 10, topDigit: draft.topScore % 10, participantName: 'Ava', resolvedAt: '2026-09-13T20:00:00.000Z', resolutionVersion: draft.expectedVersion + 1, corrected: true, correctionReason: draft.reason }] })),
}));

const digits = [0,1,2,3,4,5,6,7,8,9];

const game: GameState = {
  title: 'Booster Bowl', meta: '', leftAbbr: 'KC', leftName: 'Kansas City', topAbbr: 'PHI', topName: 'Philadelphia', dates: 'Sep 13', kickoffAt: '2026-09-13T18:00:00.000Z', gameExternalId: '401', lockTitle: false, lockMeta: false,
};

const board = (overrides: Partial<BoardData> = {}): BoardData => ({
  topAxis: Array(10).fill(null),
  leftAxis: Array(10).fill(null),
  squares: Array.from({ length: 100 }, (_, index) => index === 0 ? ['Ava'] : []),
  isDynamic: false,
  allowOpenSquares: true,
  participants: [{ id: 'p1', displayName: 'Ava', publicLabel: 'Ava' }],
  ...overrides,
});

type Props = React.ComponentProps<typeof OrganizerShell>;
const renderShell = (props: Partial<Props> = {}) => render(
  <OrganizerShell
    game={game}
    board={board()}
    activePoolId="board_1"
    liveData={null}
    winnerHistory={[]}
    notificationDeliveryIssues={[]}
    onApply={vi.fn()}
    onPublish={vi.fn(async () => '/b/SHARE123')}
    onSavePayoutDescriptions={vi.fn(async (descriptions) => descriptions)}
    onAssignOpenSquares={vi.fn(async () => undefined)}
    onReload={vi.fn()}
    onOpenViewer={vi.fn()}
    onLogout={vi.fn()}
    isActivated={false}
    isPublished={false}
    shareCode="SHARE123"
    renderPreview={() => <div data-testid="exact-preview">Private preview — sharing is off</div>}
    {...props}
  />,
);

describe('OrganizerShell Slice 10 B2', () => {
  it('renders a sticky board summary with plain-language draft and sync status', () => {
    renderShell({ saveState: { status: 'clean', revision: 7 } });
    const header = screen.getByRole('banner', { name: /board summary/i });
    expect(header).toHaveClass('sticky');
    expect(within(header).getByText('Booster Bowl')).toBeVisible();
    expect(within(header).getByText(/Draw/i)).toBeVisible();
    expect(within(header).getByText(/^Saved$/i)).toBeVisible();
    expect(within(header).getByText(/KC at PHI/i)).toBeVisible();
    expect(within(header).getByText(/Up to date/i)).toBeVisible();
  });

  it('keeps phone progress disclosure closed and avoids phase rail/tabs', () => {
    renderShell();
    const progress = screen.getByTestId('organizer-progress-disclosure');
    expect(progress).not.toHaveAttribute('open');
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('navigation', { name: /phase rail/i })).toBeNull();
  });

  it('shows one dominant artifact and blocks progression on conflict with reload callback', () => {
    const onReload = vi.fn();
    renderShell({ saveState: { status: 'conflicted', revision: 3, localRevision: 4 }, onReload });
    expect(screen.getByRole('region', { name: /fill the board/i })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Reload latest board/i }));
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('region', { name: /before you can publish/i })).toHaveTextContent(/This board changed in another session/i);
    expect(screen.getByRole('region', { name: /private follow-up/i })).toHaveTextContent(/OPEN squares/i);
    expect(screen.getByRole('button', { name: /Continue to draw/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Preview number draw/i })).toBeDisabled();
  });

  it('uses the existing crypto draw path, gates draw by lifecycle blockers, and passes committed draft through onApply', () => {
    const onApply = vi.fn();
    renderShell({ onApply, saveState: { status: 'clean', revision: 2 } });
    fireEvent.click(screen.getByRole('button', { name: /Preview number draw/i }));
    expect(screen.getByRole('region', { name: /draw numbers/i })).toHaveTextContent(/Number draw preview/i);
    expect(screen.getByRole('button', { name: /Draw again/i })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Use these numbers/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ title: 'Booster Bowl' }), expect.objectContaining({ isDynamic: false, allowOpenSquares: true }));
    const committed = onApply.mock.calls.at(-1)?.[1] as BoardData;
    expect(new Set(committed.topAxis)).toEqual(new Set(digits));
    expect(new Set(committed.leftAxis)).toEqual(new Set(digits));
  });

  it('fails closed when private participant metadata is unavailable instead of synthesizing identities', () => {
    renderShell({ board: board({ participants: undefined }), saveState: { status: 'clean', revision: 1 } });
    expect(screen.getByRole('region', { name: /before you can publish/i })).toHaveTextContent(/Make each public name unique/i);
    expect(screen.getByRole('button', { name: /Preview number draw/i })).toBeDisabled();
  });

  it('syncs clean remote revision changes without clobbering dirty local draft state', async () => {
    const first = board({ topAxis: digits, leftAxis: digits });
    const second = board({ topAxis: [...digits].reverse(), leftAxis: digits });
    const { rerender } = renderShell({ board: first, saveState: { status: 'clean', revision: 1 } });
    expect(screen.getByText(/Numbers set: top 0 1 2 3 4 5 6 7 8 9/)).toBeVisible();
    rerender(<OrganizerShell game={game} board={second} activePoolId="board_1" liveData={null} winnerHistory={[]} notificationDeliveryIssues={[]} onApply={vi.fn()} onPublish={vi.fn(async () => undefined)} onSavePayoutDescriptions={vi.fn(async (descriptions) => descriptions)} onAssignOpenSquares={vi.fn(async () => undefined)} onReload={vi.fn()} onOpenViewer={vi.fn()} onLogout={vi.fn()} isActivated={false} isPublished={false} shareCode="SHARE123" saveState={{ status: 'clean', revision: 2 }} />);
    await waitFor(() => expect(screen.getByText(/Numbers set: top 9 8 7 6 5 4 3 2 1 0/)).toBeVisible());
    rerender(<OrganizerShell game={game} board={first} activePoolId="board_1" liveData={null} winnerHistory={[]} notificationDeliveryIssues={[]} onApply={vi.fn()} onPublish={vi.fn(async () => undefined)} onSavePayoutDescriptions={vi.fn(async (descriptions) => descriptions)} onAssignOpenSquares={vi.fn(async () => undefined)} onReload={vi.fn()} onOpenViewer={vi.fn()} onLogout={vi.fn()} isActivated={false} isPublished={false} shareCode="SHARE123" saveState={{ status: 'dirty', revision: 3, localRevision: 4 }} />);
    expect(screen.getByText(/Numbers set: top 9 8 7 6 5 4 3 2 1 0/)).toBeVisible();
  });

  it('publishes only after click-time recheck, sends current payload, shows pending/error, and closes on success', async () => {
    const onPublish = vi.fn(async () => '/b/SHARE123');
    renderShell({ board: board({ topAxis: digits, leftAxis: digits }), saveState: { status: 'clean', revision: 5 }, onPublish });
    fireEvent.click(screen.getByRole('button', { name: /Review and publish/i }));
    const dialog = screen.getByRole('dialog', { name: /Publish viewer link/i });
    expect(dialog).toHaveTextContent(/What becomes public/i);
    expect(within(dialog).getByRole('button', { name: /Cancel/i })).toHaveFocus();
    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: /Publish viewer link/i })); });
    expect(onPublish).toHaveBeenCalledWith({ game, board: expect.objectContaining({ topAxis: digits, leftAxis: digits }) });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Publish viewer link/i })).toBeNull());
    expect(screen.getByRole('status')).toHaveTextContent(/Published:/);
  });

  it('keeps publish disabled for dirty save state and surfaces server publish errors without closing', async () => {
    const failingPublish = vi.fn(async () => { throw new Error('server said no'); });
    renderShell({ board: board({ topAxis: digits, leftAxis: digits }), saveState: { status: 'dirty', revision: 5, localRevision: 6 } });
    expect(screen.getByRole('button', { name: /Review and publish/i })).toBeDisabled();

    const { unmount } = renderShell({ board: board({ topAxis: digits, leftAxis: digits }), saveState: { status: 'clean', revision: 5 }, onPublish: failingPublish });
    fireEvent.click(screen.getAllByRole('button', { name: /Review and publish/i }).at(-1)!);
    const dialog = screen.getByRole('dialog', { name: /Publish viewer link/i });
    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: /Publish viewer link/i })); });
    expect(await screen.findAllByRole('alert')).toHaveLength(2);
    expect(screen.getAllByRole('alert').map((node) => node.textContent).join(' ')).toMatch(/server said no/i);
    expect(screen.getByRole('dialog', { name: /Publish viewer link/i })).toBeVisible();
    unmount();
  });

  it('renders game-day controls with real server-backed seams and correction flow boundaries', () => {
    const onOpenViewer = vi.fn();
    renderShell({ board: board({ topAxis: digits, leftAxis: digits }), isActivated: true, isPublished: true, onOpenViewer });
    expect(screen.getByRole('region', { name: /game day/i })).toHaveTextContent(/Automatic scoring authority/i);
    fireEvent.click(screen.getByRole('button', { name: /Open public board/i }));
    expect(onOpenViewer).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /^Manual$/i })).toBeVisible();
    expect(screen.getByRole('region', { name: /corrections and final record/i })).toHaveTextContent(/Correct a published result here/i);
    expect(screen.getByLabelText(/^Final record$/i)).toBeVisible();
  });

  it('explains completed boards as locked final records and routes organizers toward another board', () => {
    renderShell({
      board: board({ topAxis: digits, leftAxis: digits }),
      isActivated: true,
      isPublished: true,
      liveData: { leftScore: 24, topScore: 31, quarterScores: { Q1: { left: 7, top: 7 }, Q2: { left: 3, top: 7 }, Q3: { left: 7, top: 10 }, Q4: { left: 7, top: 7 }, OT: { left: 0, top: 0 } }, clock: '0:00', period: 4, state: 'post', detail: 'Final', isOvertime: false },
      winnerHistory: [{ milestone: 'FINAL', sideScore: 24, topScore: 31, sideDigit: 4, topDigit: 1, participantName: 'Ava', resolvedAt: '2026-09-13T22:00:00.000Z' }],
    });
    const completed = screen.getByRole('region', { name: /completed board/i });
    expect(completed).toHaveTextContent(/This board is locked as the Final record/i);
    expect(within(completed).getByRole('link', { name: /Create another board/i })).toHaveAttribute('href', '/create');
  });

  it('saves payout descriptions through the existing BoardView callback and refreshes', async () => {
    const onSavePayoutDescriptions = vi.fn(async (descriptions) => descriptions);
    const onReload = vi.fn();
    renderShell({ board: board({ topAxis: digits, leftAxis: digits }), isPublished: true, onSavePayoutDescriptions, onReload });
    fireEvent.change(screen.getByLabelText(/Q1 prize/i), { target: { value: 'Q1 wins gift card' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Save prize notes/i })); });
    expect(onSavePayoutDescriptions).toHaveBeenCalledWith(expect.objectContaining({ Q1: 'Q1 wins gift card' }));
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('status')).toHaveTextContent(/Prize notes saved/i);
  });

  it('assigns a late OPEN square before kickoff through the existing callback and reloads server data', async () => {
    const onAssignOpenSquares = vi.fn(async () => undefined);
    const onReload = vi.fn();
    renderShell({ board: board({ topAxis: digits, leftAxis: digits }), isPublished: true, onAssignOpenSquares, onReload });
    fireEvent.change(screen.getByLabelText(/Purchaser label/i), { target: { value: 'Moss Family' } });
    fireEvent.click(screen.getByRole('button', { name: /Square 2:\s*OPEN/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Assign selected OPEN square/i })); });
    expect(onAssignOpenSquares).toHaveBeenCalledWith(expect.arrayContaining([['Ava'], ['Moss Family']]));
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('status')).toHaveTextContent(/Square 2 assigned before kickoff/i);
  });

  it('drives manual score enable, save, and automatic return through unchanged score API service seams', async () => {
    const onReload = vi.fn();
    renderShell({ board: board({ topAxis: digits, leftAxis: digits }), isActivated: true, isPublished: true, onReload });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Manual$/i })); });
    expect(enableManualScoringOnServer).toHaveBeenCalledWith('board_1');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Publish manual score/i })); });
    expect(saveManualScoreToServer).toHaveBeenCalledWith('board_1', expect.objectContaining({ useManualScores: true }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Auto$/i })); });
    expect(returnAutomaticScoringOnServer).toHaveBeenCalledWith('board_1');
    expect(onReload).toHaveBeenCalled();
  });

  it('publishes milestone correction with expected revision, reason, and public audit history', async () => {
    const history: WinnerResolution[] = [{ milestone: 'Q1', sideScore: 3, topScore: 7, sideDigit: 3, topDigit: 7, participantName: 'Ava', resolvedAt: '2026-09-13T19:00:00.000Z', resolutionVersion: 2 }];
    renderShell({ board: board({ topAxis: digits, leftAxis: digits }), isPublished: true, winnerHistory: history });
    fireEvent.change(screen.getByLabelText(/Result to correct/i), { target: { value: 'Q1' } });
    fireEvent.change(screen.getByLabelText(/^Side score$/i), { target: { value: '13' } });
    fireEvent.change(screen.getByLabelText(/Why this changed/i), { target: { value: 'Official correction' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Publish correction$/i })); });
    expect(publishMilestoneCorrectionToServer).toHaveBeenCalledWith('board_1', expect.objectContaining({ milestone: 'Q1', expectedVersion: 2, sideScore: 13, reason: 'Official correction' }));
    expect(await screen.findByText(/Q1: Ava — corrected: Official correction/i)).toBeVisible();
  });
});
