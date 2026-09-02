import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

vi.mock('../../src/features/organizer/services/game-day/manualScoreService', () => ({
  enableManualScoringOnServer: vi.fn(async () => ({})),
  saveManualScoreToServer: vi.fn(async () => ({ score: null })),
  returnAutomaticScoringOnServer: vi.fn(async () => ({})),
}));

vi.mock('../../src/features/organizer/services/corrections/milestoneCorrectionService', () => ({
  publishMilestoneCorrectionToServer: vi.fn(async () => ({ winnerHistory: [] })),
}));

vi.mock('../../components/ScheduledGamePicker', () => ({
  default: ({ onChange }: { onChange: (game: any) => void }) => (
    <button
      type="button"
      onClick={() => onChange({
        id: '401000001',
        kickoffAt: '2026-09-10T00:20:00.000Z',
        state: 'pre',
        season: 2026,
        week: 1,
        awayTeam: { abbr: 'DAL', name: 'Dallas Cowboys' },
        homeTeam: { abbr: 'WAS', name: 'Washington Commanders' },
      })}
    >
      Select test game
    </button>
  ),
}));

vi.mock('../../src/features/organizer/workspace/renamePublishedSquare', () => ({
  renamePublishedSquare: vi.fn(async () => undefined),
}));

import OrganizerWorkspace from '../../src/features/organizer/workspace/OrganizerWorkspace';
import { saveEntryMeta } from '../../src/features/organizer/workspace/entryMetaService';
import { enableManualScoringOnServer } from '../../src/features/organizer/services/game-day/manualScoreService';
import { publishMilestoneCorrectionToServer } from '../../src/features/organizer/services/corrections/milestoneCorrectionService';
import { renamePublishedSquare } from '../../src/features/organizer/workspace/renamePublishedSquare';

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

const writeText = vi.fn(async () => undefined);

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
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


describe('OrganizerWorkspace game change', () => {
  it('folds the picked game into the draft and autosaves the new matchup', async () => {
    vi.useFakeTimers();
    try {
      const onPublish = vi.fn(async (_data: { game: GameState; board: BoardData }) => 'pool-1');
      renderWorkspace({ board: boardWithAssignments(3), onPublish: onPublish as any });

      fireEvent.click(screen.getByRole('button', { name: 'Change game' }));
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Select test game' }));
      });

      expect(screen.getByText('DAL at WAS', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(900);
      });

      expect(onPublish).toHaveBeenCalledTimes(1);
      expect(onPublish.mock.calls[0]![0].game).toMatchObject({
        leftAbbr: 'DAL',
        topAbbr: 'WAS',
        gameExternalId: '401000001',
        kickoffAt: '2026-09-10T00:20:00.000Z',
        dates: '2026-09-10',
        useManualScores: false,
        scoreSnapshot: null,
      });
    } finally {
      vi.useRealTimers();
    }
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
    // The reload is deferred until the organizer leaves the published sheet, so the
    // success surface cannot be torn out from under them by a re-render.
    expect(onReload).not.toHaveBeenCalled();
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

  it('keeps the published sheet on screen through a reload that flips isPublished', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ published: true, shareCode: 'abc123', viewerUrl: '/b/abc123', revision: 4, tier: 'gameday', used: 2, allowance: 5 }),
    });
    const onReload = vi.fn(async () => {});
    const view = renderWorkspace({ board: drawnBoard(100), onReload });
    onReload.mockImplementation(async () => {
      view.rerender(<OrganizerWorkspace {...view.props} isPublished />);
    });

    await openPublishSheet();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Publish viewer link' }));
    });

    expect(await screen.findByRole('heading', { name: 'Published' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Copy link' }).length).toBeGreaterThan(0);
    expect(onReload).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Enter game-day controls' }));
    });

    expect(onReload).toHaveBeenCalled();
    expect(await screen.findByText('Score authority')).toBeInTheDocument();
  });

  it('publishes once the flush started by the click settles clean', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ published: true, shareCode: 'abc123', viewerUrl: '/b/abc123', revision: 4, tier: 'gameday', used: 2, allowance: 5 }),
    });
    let releaseSave: (() => void) | null = null;
    const onPublish = vi.fn(() => new Promise<string>((resolve) => { releaseSave = () => resolve('pool-1'); }));
    renderWorkspace({ board: drawnBoard(100), onPublish: onPublish as any });

    await openPublishSheet();
    fireEvent.change(screen.getByLabelText('Board name'), { target: { value: 'Renamed Board' } });
    fireEvent.blur(screen.getByLabelText('Board name'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Publish viewer link' }));
    });
    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();

    await act(async () => { releaseSave?.(); });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/pools/pool-1/publish', expect.objectContaining({ method: 'POST' })));
    expect(screen.queryByText('Publish blocked. Reload or save the latest clean draft before publishing.')).not.toBeInTheDocument();
  });

  it('disables the publish button while a non-save hard blocker remains', async () => {
    renderWorkspace({
      board: drawnBoard(100),
      game: { ...game, gameExternalId: undefined, kickoffAt: undefined },
    });

    await openPublishSheet();

    expect(screen.getByRole('button', { name: 'Publish viewer link' })).toBeDisabled();
  });
});

describe('OrganizerWorkspace acknowledgement gate', () => {
  it('routes Replace draft draw through the open-square acknowledgement', async () => {
    const board: BoardData = {
      ...boardWithAssignments(40),
      topAxis: [3, 1, 4, 0, 5, 9, 2, 6, 8, 7],
      leftAxis: [7, 8, 6, 2, 9, 5, 0, 4, 1, 3],
    };
    const { onApply } = renderWorkspace({ board });

    fireEvent.click(screen.getByRole('button', { name: 'Replace draft draw' }));
    expect(screen.getByRole('group', { name: '60 squares are open. Draw anyway?' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Draw with 60 OPEN' }));
    });

    expect(lastBoard(onApply).allowOpenSquares).toBe(true);
    expect(screen.getByRole('button', { name: 'Use these numbers' })).toBeInTheDocument();
  });

  it('records the acknowledgement on the board when the draw is committed with open squares', async () => {
    const { onApply } = renderWorkspace({ board: boardWithAssignments(40) });

    expandIsland();
    fireEvent.click(screen.getByRole('button', { name: 'Draw numbers' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Draw with 60 OPEN' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use these numbers' }));
    });

    const board = lastBoard(onApply);
    expect(board.allowOpenSquares).toBe(true);
    expect(board.topAxis.every((digit) => typeof digit === 'number')).toBe(true);
  });

  it('acknowledges a square blanked after the draw without staging a new draw', async () => {
    const board: BoardData = {
      ...boardWithAssignments(40),
      topAxis: [3, 1, 4, 0, 5, 9, 2, 6, 8, 7],
      leftAxis: [7, 8, 6, 2, 9, 5, 0, 4, 1, 3],
    };
    const { onApply } = renderWorkspace({ board });

    expect(screen.getByRole('group', { name: '60 squares are open. Publish with them open?' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Keep 60 OPEN' }));
    });

    expect(lastBoard(onApply).allowOpenSquares).toBe(true);
    expect(screen.queryByRole('button', { name: 'Use these numbers' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Replace draft draw' })).toBeInTheDocument();
  });
});

describe('OrganizerWorkspace error alerts', () => {
  it('keeps the new name on the board and reports the failed detail save', async () => {
    (saveEntryMeta as any).mockRejectedValueOnce(new Error('network down'));
    renderWorkspace();

    fireEvent.click(screen.getByRole('button', { name: 'Square 1, unassigned' }));
    fireEvent.change(screen.getByLabelText('Name on the board'), { target: { value: 'Dana P.' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(screen.getByRole('button', { name: 'Square 1, assigned to Dana P.' })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('Square details were not saved');
  });
});

describe('OrganizerWorkspace draft participant identities', () => {
  const withoutParticipants = (squares: string[][]): BoardData => ({
    topAxis: Array(10).fill(null),
    leftAxis: Array(10).fill(null),
    squares,
  });

  it('treats unique names on a board with no participants array as unambiguous', () => {
    renderWorkspace({
      board: withoutParticipants(Array.from({ length: 100 }, (_, index) => (index < 3 ? [NAMES[index]] : []))),
    });
    expandIsland();

    expect(screen.getByRole('button', { name: 'Draw numbers' })).toBeEnabled();
    expect(screen.queryByText(/Make each public name unique/)).not.toBeInTheDocument();
  });

  it('reports two labels that normalize to the same identity as ambiguous', () => {
    renderWorkspace({
      board: withoutParticipants(Array.from({ length: 100 }, (_, index) => {
        if (index === 0) return ['Jose'];
        if (index === 1) return ['Jos\u00e9'];
        return [] as string[];
      })),
    });
    expandIsland();

    expect(screen.getByRole('button', { name: 'Draw numbers' })).toBeDisabled();
    expect(screen.getAllByText(/Make each public name unique/).length).toBeGreaterThan(0);
  });
});

describe('OrganizerWorkspace published boards', () => {
  const renderPublished = (overrides: Overrides = {}) => renderWorkspace({
    board: drawnBoard(100),
    isPublished: true,
    shareCode: 'abc123',
    ...overrides,
  });

  it('marks the board published and drops the draft save pill', () => {
    renderPublished();

    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Paste names')).not.toBeInTheDocument();
  });

  it('copies the viewer link from the island', async () => {
    renderPublished();
    expandIsland();

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Copy link' })[0]);
    });

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/b/abc123`);
    expect(await screen.findByText('Viewer link copied.')).toBeInTheDocument();
  });

  it('sends a late fill through onAssignOpenSquares and reloads', async () => {
    const onAssignOpenSquares = vi.fn(async (_squares: string[][]) => undefined);
    const { onReload } = renderPublished({ board: drawnBoard(99), onAssignOpenSquares });

    fireEvent.click(screen.getByRole('button', { name: 'Square 100, unassigned' }));
    fireEvent.change(screen.getByLabelText('Name on the board'), { target: { value: 'Dana P.' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(onAssignOpenSquares).toHaveBeenCalledTimes(1);
    const squares = onAssignOpenSquares.mock.calls[0][0];
    expect(squares[99]).toEqual(['Dana P.']);
    expect(onReload).toHaveBeenCalled();
  });

  it('refuses to clear a published assignment and never routes it through the late-fill callback', async () => {
    const onAssignOpenSquares = vi.fn(async (_squares: string[][]) => undefined);
    renderPublished({ board: drawnBoard(99), onAssignOpenSquares });

    fireEvent.click(screen.getByRole('button', { name: `Square 1, assigned to ${NAMES[0]}` }));
    fireEvent.change(screen.getByLabelText('Name on the board'), { target: { value: '  ' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Published assignments cannot be changed. Select OPEN squares only.');
    expect(onAssignOpenSquares).not.toHaveBeenCalled();
    expect(renamePublishedSquare).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: `Square 1, assigned to ${NAMES[0]}` })).toBeInTheDocument();
  });

  it('renames a published square through the audited RPC', async () => {
    renderPublished({ board: drawnBoard(99) });

    fireEvent.click(screen.getByRole('button', { name: `Square 1, assigned to ${NAMES[0]}` }));
    fireEvent.change(screen.getByLabelText('Name on the board'), { target: { value: 'Dana Prince' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(renamePublishedSquare).toHaveBeenCalledWith('pool-1', 0, 'Dana Prince');
    expect(screen.getByRole('button', { name: 'Square 1, assigned to Dana Prince' })).toBeInTheDocument();
    expect(await screen.findByText(`Square 1 changed from ${NAMES[0]} to Dana Prince. The change is in the board history.`)).toBeInTheDocument();
  });

  it('restores the previous name when the rename fails', async () => {
    (renamePublishedSquare as any).mockRejectedValueOnce(new Error('rpc down'));
    renderPublished({ board: drawnBoard(99) });

    fireEvent.click(screen.getByRole('button', { name: `Square 1, assigned to ${NAMES[0]}` }));
    fireEvent.change(screen.getByLabelText('Name on the board'), { target: { value: 'Dana P.' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(screen.getByRole('button', { name: `Square 1, assigned to ${NAMES[0]}` })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('rpc down');
  });

  it('switches score authority to manual through the service', async () => {
    renderPublished();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Manual' }));
    });

    expect(enableManualScoringOnServer).toHaveBeenCalledWith('pool-1');
    expect(await screen.findByText('Manual scoring is on. Enter the score, then publish it.')).toBeInTheDocument();
  });

  it('keeps the quarters seeded from the snapshot and does not reload them away', async () => {
    const scoreSnapshot = {
      leftScore: 14,
      topScore: 3,
      quarterScores: { Q1: { left: 7, top: 3 }, Q2: { left: 7, top: 0 }, Q3: { left: 0, top: 0 }, Q4: { left: 0, top: 0 }, OT: { left: 0, top: 0 } },
      clock: '12:00',
      period: 3,
      state: 'in' as const,
      detail: '',
      isOvertime: false,
    };
    const { onReload } = renderPublished({ game: { ...game, scoreSnapshot } as GameState });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Manual' }));
    });

    const panel = screen.getByText(/Enter each quarter's points/).parentElement!;
    const quarters = within(panel).getAllByRole('spinbutton').map((input) => (input as HTMLInputElement).value);
    expect(quarters).toEqual(['7', '3', '7', '0', '0', '0', '0', '0', '0', '0']);
    expect(onReload).not.toHaveBeenCalled();
  });

  it('publishes a milestone correction from the side rail', async () => {
    const winnerHistory = [{
      milestone: 'Q1' as const,
      sideScore: 7,
      topScore: 3,
      sideDigit: 7,
      topDigit: 3,
      participantName: NAMES[0],
      cellIndex: 0,
      resolvedAt: '2026-09-13T18:00:00.000Z',
      resolutionVersion: 1,
    }];
    renderPublished({ winnerHistory });

    fireEvent.change(screen.getByLabelText('Result to correct'), { target: { value: 'Q1' } });
    fireEvent.change(screen.getByLabelText('Why this changed (shown publicly)'), { target: { value: 'Scoreboard error' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Publish correction' }));
    });

    expect(publishMilestoneCorrectionToServer).toHaveBeenCalledWith('pool-1', expect.objectContaining({ milestone: 'Q1', reason: 'Scoreboard error' }));
  });

  it('locks the board as the final record once the game is over', () => {
    renderPublished({ liveData: { state: 'post', leftScore: 21, topScore: 17, isManual: false } as any });

    expect(screen.getByText('This board is locked as the Final record.')).toBeInTheDocument();
    expandIsland();
    expect(screen.getAllByRole('link', { name: 'Create another board' }).length).toBeGreaterThan(0);
  });
});
