import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { BoardData, EntryMeta, GameState } from '../../types';

vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 'token' } } })) },
    from: vi.fn(() => ({ upsert: vi.fn(async () => ({ error: null })), delete: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })) })),
  },
}));

vi.mock('../../src/features/organizer/workspace/entryMetaService', () => ({
  saveEntryMeta: vi.fn(async () => undefined),
  clearEntryMeta: vi.fn(async () => undefined),
}));

vi.mock('../../services/boardImportService', () => ({
  parseBoardImage: vi.fn(async () => ({ topAxis: Array(10).fill(null), leftAxis: Array(10).fill(null), squares: Array.from({ length: 100 }, () => []) })),
}));

vi.mock('../../utils/boardImage', () => ({
  renderBoardPng: vi.fn(async () => new Blob(['x'])),
  shareBoardPng: vi.fn(async () => 'downloaded'),
  boardImageFilename: vi.fn(() => 'board.png'),
}));

import OrganizerWorkspace from '../../src/features/organizer/workspace/OrganizerWorkspace';
import { saveEntryMeta } from '../../src/features/organizer/workspace/entryMetaService';

const NAMES = ['Ann R.', 'Bo T.', 'Cy L.'];

const game: GameState = {
  title: 'Lincoln Boosters Board',
  meta: '',
  gameExternalId: 'evt-1',
  kickoffAt: '2026-09-13T17:00:00.000Z',
  leftAbbr: 'KC',
  leftName: 'Kansas City',
  topAbbr: 'PHI',
  topName: 'Philadelphia',
  dates: 'Sep 13, 1:00 PM ET',
  lockTitle: false,
  lockMeta: false,
  payoutDescriptions: {},
};

const participants = NAMES.map((name, index) => ({ id: `p${index}`, displayName: name, publicLabel: name }));

const emptyBoard = (): BoardData => ({
  topAxis: Array(10).fill(null),
  leftAxis: Array(10).fill(null),
  squares: Array.from({ length: 100 }, () => [] as string[]),
  participants,
});

const boardWithAssignments = (count: number): BoardData => ({
  ...emptyBoard(),
  squares: Array.from({ length: 100 }, (_, index) => (index < count ? [NAMES[index % NAMES.length]] : [])),
});

const drawnBoard = (count: number): BoardData => ({
  ...boardWithAssignments(count),
  topAxis: [3, 1, 4, 0, 5, 9, 2, 6, 8, 7],
  leftAxis: [7, 8, 6, 2, 9, 5, 0, 4, 1, 3],
  allowOpenSquares: true,
});

const paidMeta = (index: number): EntryMeta => ({
  cell_index: index,
  paid_status: 'paid',
  notify_opt_in: false,
  contact_type: null,
  contact_value: null,
  seller_label: 'Coach Lee',
});

type Overrides = Partial<React.ComponentProps<typeof OrganizerWorkspace>>;

function renderWorkspace(overrides: Overrides = {}) {
  const onApply = vi.fn();
  const onPublish = vi.fn(async () => 'pool-1');
  const onEntryMetaChange = vi.fn();
  const onReload = vi.fn(async () => undefined);
  const props = {
    game,
    board: emptyBoard(),
    activePoolId: 'pool-1',
    liveData: null,
    winnerHistory: [],
    notificationDeliveryIssues: [],
    revision: 2,
    entryMeta: {} as Record<number, EntryMeta>,
    onEntryMetaChange,
    onApply,
    onPublish,
    onSavePayoutDescriptions: vi.fn(async (d: any) => d),
    onAssignOpenSquares: vi.fn(async () => undefined),
    onReload,
    onOpenViewer: vi.fn(),
    onLogout: vi.fn(),
    isActivated: true,
    isPublished: false,
    shareCode: null,
    ...overrides,
  } as React.ComponentProps<typeof OrganizerWorkspace>;
  const utils = render(<OrganizerWorkspace {...props} />);
  return { ...utils, props, onApply, onPublish, onEntryMetaChange, onReload };
}

const expandIsland = () => fireEvent.click(screen.getByRole('button', { name: /organizer status/i }));
const lastBoard = (onApply: ReturnType<typeof vi.fn>): BoardData => onApply.mock.calls.at(-1)![1];

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('OrganizerWorkspace island', () => {
  it('renders the status rings from the board and the entry metadata', () => {
    renderWorkspace({
      board: boardWithAssignments(3),
      entryMeta: { 0: paidMeta(0), 1: paidMeta(1) },
    });

    expect(screen.getByRole('img', { name: '3 of 100 squares filled' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '2 of 3 paid' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Numbers not drawn' })).toBeInTheDocument();
  });

  it('offers Fill the board while nothing is assigned', () => {
    renderWorkspace();
    expandIsland();
    expect(screen.getByRole('button', { name: 'Fill the board' })).toBeInTheDocument();
  });

  it('offers Draw numbers once a square is assigned', () => {
    renderWorkspace({ board: boardWithAssignments(1) });
    expandIsland();
    expect(screen.getByRole('button', { name: 'Draw numbers' })).toBeEnabled();
  });

  it('offers Preview once the numbers are committed', () => {
    renderWorkspace({ board: drawnBoard(100) });
    expandIsland();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Numbers drawn' })).toBeInTheDocument();
  });
});

describe('OrganizerWorkspace draw flow', () => {
  it('asks about open squares, records the opt-in, and previews digits', async () => {
    const { onApply } = renderWorkspace({ board: boardWithAssignments(1) });
    expandIsland();

    fireEvent.click(screen.getByRole('button', { name: 'Draw numbers' }));
    expect(screen.getByRole('group', { name: '99 squares are open. Draw anyway?' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Draw with 99 OPEN' }));
    });

    expect(lastBoard(onApply).allowOpenSquares).toBe(true);
    expect(screen.getByText('Draft draw')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use these numbers' })).toBeInTheDocument();
  });

  it('commits exact 0-9 permutations for both axes and turns off changing numbers', async () => {
    const { onApply } = renderWorkspace({ board: boardWithAssignments(1) });
    expandIsland();

    fireEvent.click(screen.getByRole('button', { name: 'Draw numbers' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Draw with 99 OPEN' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use these numbers' }));
    });

    const board = lastBoard(onApply);
    expect([...board.topAxis].sort((a, b) => Number(a) - Number(b))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect([...board.leftAxis].sort((a, b) => Number(a) - Number(b))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(board.isDynamic).toBe(false);
    expect(board.leftAxisByQuarter).toBeUndefined();
    expect(board.topAxisByQuarter).toBeUndefined();
    expect(screen.queryByText('Draft draw')).not.toBeInTheDocument();
  });

  it('skips the open-square question when the board is already full', async () => {
    renderWorkspace({ board: boardWithAssignments(100) });
    expandIsland();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Draw numbers' }));
    });

    expect(screen.queryByRole('group', { name: /squares are open/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use these numbers' })).toBeInTheDocument();
  });
});

describe('OrganizerWorkspace square assignment', () => {
  it('writes the name, saves the private note, and reports it back', async () => {
    const { onApply, onEntryMetaChange } = renderWorkspace();

    fireEvent.click(screen.getByRole('button', { name: 'Square 1, unassigned' }));
    fireEvent.change(screen.getByLabelText('Name on the board'), { target: { value: 'Dana P.' } });
    fireEvent.change(screen.getByLabelText('Sold by (optional)'), { target: { value: 'Coach Lee' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Paid' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(lastBoard(onApply).squares[0]).toEqual(['Dana P.']);
    expect(saveEntryMeta).toHaveBeenCalledWith('pool-1', expect.objectContaining({
      cell_index: 0,
      paid_status: 'paid',
      seller_label: 'Coach Lee',
    }));
    expect(onEntryMetaChange).toHaveBeenCalledWith(expect.objectContaining({ cell_index: 0 }));
  });

  it('moves to the next open square on Save and next', async () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole('button', { name: 'Square 1, unassigned' }));
    fireEvent.change(screen.getByLabelText('Name on the board'), { target: { value: 'Dana P.' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save and next' }));
    });

    expect(await screen.findByRole('heading', { name: 'Square 2' })).toBeInTheDocument();
  });

  it('fills open cells in order from a pasted list', async () => {
    const { onApply } = renderWorkspace({ board: boardWithAssignments(1) });

    const textarea = screen.getByLabelText('Paste names');
    await act(async () => {
      fireEvent.blur(textarea, { target: { value: 'Dana P.\n\nEli M.\n' } });
    });

    const board = lastBoard(onApply);
    expect(board.squares[0]).toEqual([NAMES[0]]);
    expect(board.squares[1]).toEqual(['Dana P.']);
    expect(board.squares[2]).toEqual(['Eli M.']);
  });
});

describe('OrganizerWorkspace publish', () => {
  const openPublishSheet = async () => {
    expandIsland();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Review and publish' }));
    });
  };

  it('blocks publishing while the latest draft has not saved cleanly', async () => {
    const onPublish = vi.fn(async () => {
      throw new Error('The board could not be saved.');
    });
    renderWorkspace({ board: drawnBoard(100), onPublish: onPublish as any });

    fireEvent.click(screen.getByRole('button', { name: `Square 1, assigned to ${NAMES[0]}` }));
    fireEvent.change(screen.getByLabelText('Name on the board'), { target: { value: 'Dana P.' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    await openPublishSheet();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Publish viewer link' }));
    });

    expect(await screen.findByText('Publish blocked. Reload or save the latest clean draft before publishing.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('publishes and shows the shareable link', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ published: true, shareCode: 'abc123', viewerUrl: '/b/abc123', revision: 4, tier: 'gameday', used: 2, allowance: 5 }),
    });
    const { onReload } = renderWorkspace({ board: drawnBoard(100) });

    await openPublishSheet();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Publish viewer link' }));
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/pools/pool-1/publish', expect.objectContaining({ method: 'POST' }));
    expect(await screen.findByRole('heading', { name: 'Published' })).toBeInTheDocument();
    expect(screen.getByText(`${window.location.origin}/b/abc123`)).toBeInTheDocument();
    await waitFor(() => expect(onReload).toHaveBeenCalled());
  });

  it('opens the plan sheet when the account is out of published boards', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 402,
      json: async () => ({ upgradeTo: 'gameday', error: 'Free plan allows one published board.' }),
    });
    renderWorkspace({ board: drawnBoard(100) });

    await openPublishSheet();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Publish viewer link' }));
    });

    expect(await screen.findByRole('heading', { name: 'Choose a plan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to \$9\.99 checkout/ })).toBeInTheDocument();
  });
});

describe('OrganizerWorkspace published boards', () => {
  it('shows the stage 5b placeholder instead of the draft tools', () => {
    renderWorkspace({ board: drawnBoard(100), isPublished: true, shareCode: 'abc123' });

    expect(screen.getByText('Game-day controls arrive in stage 5b.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Paste names')).not.toBeInTheDocument();
  });
});
