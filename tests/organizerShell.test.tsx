import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OrganizerShell from '../features/organizer/shell/OrganizerShell';
import type { BoardData, GameState } from '../types';

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
  it('renders sticky task header with board, phase, save revision, time, and conflict status', () => {
    renderShell({ saveState: { status: 'clean', revision: 7 } });
    const header = screen.getByRole('banner', { name: /organizer task header/i });
    expect(header).toHaveClass('sticky');
    expect(within(header).getByText('Booster Bowl')).toBeVisible();
    expect(within(header).getByText(/Draw/i)).toBeVisible();
    expect(within(header).getByText(/Saved · rev 7/i)).toBeVisible();
    expect(within(header).getByText(/KC at PHI/i)).toBeVisible();
    expect(within(header).getByText(/No conflict/i)).toBeVisible();
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
    expect(screen.getByRole('region', { name: /assignment workspace/i })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Reload latest board/i }));
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('region', { name: /hard blockers/i })).toHaveTextContent(/This board changed in another session/i);
    expect(screen.getByRole('region', { name: /private advisories/i })).toHaveTextContent(/open squares/i);
    expect(screen.getByRole('button', { name: /Continue to draw/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Preview draw/i })).toBeDisabled();
  });

  it('uses the existing crypto draw path, gates draw by lifecycle blockers, and passes committed draft through onApply', () => {
    const onApply = vi.fn();
    renderShell({ onApply, saveState: { status: 'clean', revision: 2 } });
    fireEvent.click(screen.getByRole('button', { name: /Preview draw/i }));
    expect(screen.getByRole('region', { name: /draw workspace/i })).toHaveTextContent(/Draft draw preview/i);
    expect(screen.getByRole('button', { name: /Regenerate/i })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Commit draw/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ title: 'Booster Bowl' }), expect.objectContaining({ isDynamic: false, allowOpenSquares: true }));
    const committed = onApply.mock.calls.at(-1)?.[1] as BoardData;
    expect(new Set(committed.topAxis)).toEqual(new Set(digits));
    expect(new Set(committed.leftAxis)).toEqual(new Set(digits));
  });

  it('fails closed when private participant metadata is unavailable instead of synthesizing identities', () => {
    renderShell({ board: board({ participants: undefined }), saveState: { status: 'clean', revision: 1 } });
    expect(screen.getByRole('region', { name: /hard blockers/i })).toHaveTextContent(/duplicate_or_ambiguous_public_identity/);
    expect(screen.getByRole('button', { name: /Preview draw/i })).toBeDisabled();
  });

  it('syncs clean remote revision changes without clobbering dirty local draft state', async () => {
    const first = board({ topAxis: digits, leftAxis: digits });
    const second = board({ topAxis: [...digits].reverse(), leftAxis: digits });
    const { rerender } = renderShell({ board: first, saveState: { status: 'clean', revision: 1 } });
    expect(screen.getByText(/Committed draw: top 0 1 2 3 4 5 6 7 8 9/)).toBeVisible();
    rerender(<OrganizerShell game={game} board={second} activePoolId="board_1" liveData={null} winnerHistory={[]} notificationDeliveryIssues={[]} onApply={vi.fn()} onPublish={vi.fn(async () => undefined)} onSavePayoutDescriptions={vi.fn(async (descriptions) => descriptions)} onAssignOpenSquares={vi.fn(async () => undefined)} onReload={vi.fn()} onOpenViewer={vi.fn()} onLogout={vi.fn()} isActivated={false} isPublished={false} shareCode="SHARE123" saveState={{ status: 'clean', revision: 2 }} />);
    await waitFor(() => expect(screen.getByText(/Committed draw: top 9 8 7 6 5 4 3 2 1 0/)).toBeVisible());
    rerender(<OrganizerShell game={game} board={first} activePoolId="board_1" liveData={null} winnerHistory={[]} notificationDeliveryIssues={[]} onApply={vi.fn()} onPublish={vi.fn(async () => undefined)} onSavePayoutDescriptions={vi.fn(async (descriptions) => descriptions)} onAssignOpenSquares={vi.fn(async () => undefined)} onReload={vi.fn()} onOpenViewer={vi.fn()} onLogout={vi.fn()} isActivated={false} isPublished={false} shareCode="SHARE123" saveState={{ status: 'dirty', revision: 3, localRevision: 4 }} />);
    expect(screen.getByText(/Committed draw: top 9 8 7 6 5 4 3 2 1 0/)).toBeVisible();
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

  it('renders game-day controls without decorative manual buttons and correction flow boundaries', () => {
    const onOpenViewer = vi.fn();
    renderShell({ board: board({ topAxis: digits, leftAxis: digits }), isPublished: true, onOpenViewer });
    expect(screen.getByRole('region', { name: /game-day controls/i })).toHaveTextContent(/Automatic scoring authority/i);
    fireEvent.click(screen.getByRole('button', { name: /Open viewer/i }));
    expect(onOpenViewer).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /Switch to Manual scoring authority/i })).toBeNull();
    expect(screen.getByRole('region', { name: /correction flow/i })).toHaveTextContent(/audited public correction/i);
  });
});
