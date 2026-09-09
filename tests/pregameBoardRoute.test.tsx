import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ pool: {} as any, scoring: vi.fn() }));
vi.mock('../hooks/usePoolData', () => ({ usePoolData: () => m.pool, INITIAL_GAME: {} }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock('../hooks/useContestEntries', () => ({ useContestEntries: () => ({ entryMetaByIndex: {}, hasLoadedEntries: true, setEntryMetaByIndex: vi.fn() }) }));
vi.mock('../hooks/useBoardActions', () => ({ useBoardActions: () => ({ handlePublish: vi.fn() }) }));
vi.mock('../hooks/useLiveScoring', () => ({ useLiveScoring: (...args: any[]) => { m.scoring(...args); return { liveData: { leftScore: 0, topScore: 0, quarterScores: {}, state: 'pre', period: 0 }, winnerHistory: [], pendingMilestones: [], liveStatus: 'idle' }; } }));
vi.mock('../services/supabase', () => ({ supabase: {} }));
vi.mock('../src/features/viewer/shell/ViewerShell', () => ({ default: () => <main>Finalized game viewer</main> }));
import BoardView from '../components/BoardView';
beforeEach(() => {
  m.scoring.mockClear();
  m.pool = { game: { title: 'Team board', leftName: 'Dallas', topName: 'Washington' }, board: { squares: Array.from({ length: 100 }, () => []), allocationLabels: Array(100).fill('Mora family') }, activePoolId: 'ABCDEFGH', shareCode: 'ABCDEFGH', ownerId: null, loadingPool: false, dataReady: true, isShared: true, isPublished: false, isActivated: true, winnerHistory: [], pendingMilestones: [], loadPoolData: vi.fn(), setBoard: vi.fn(), setGame: vi.fn(), updatedAt: '2026-09-04T12:00:00Z' };
});
const show = () => render(<MemoryRouter initialEntries={['/b/ABCDEFGH']}><Routes><Route path="/b/:shareCode" element={<BoardView />} /></Routes></MemoryRouter>);
it('routes a shared unfinalized board to selling view without score services', () => {
  show();
  expect(screen.getByRole('main', { name: 'Team board selling board' })).toBeInTheDocument();
  expect(screen.queryByText('Finalized game viewer')).not.toBeInTheDocument();
  expect(m.scoring.mock.lastCall?.[5]).toBe(false);
});
it('uses game viewer once the same shared board is finalized', () => {
  m.pool.isPublished = true;
  show();
  expect(screen.getByText('Finalized game viewer')).toBeInTheDocument();
  expect(m.scoring.mock.lastCall?.[5]).toBe(true);
});

it('offers a retry when reloading the board fails', () => {
  m.pool.error = 'Connection unavailable';
  show();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
});
