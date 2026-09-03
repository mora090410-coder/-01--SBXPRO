import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BoardView from '../components/BoardView';
import { SAMPLE_BOARD } from '../constants';

const mocks = vi.hoisted(() => ({
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    signOut: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: null, loading: false, session: null, signOut: mocks.signOut }),
}));

vi.mock('../services/supabase', () => ({
    supabase: {
        auth: {
            getSession: mocks.getSession,
            signOut: mocks.signOut,
        },
    },
}));

vi.mock('../hooks/usePoolData', async () => {
    const actual = await vi.importActual<typeof import('../hooks/usePoolData')>('../hooks/usePoolData');
    return {
        ...actual,
        usePoolData: () => ({
            game: { ...actual.INITIAL_GAME, title: 'Test board', leftAbbr: 'KC', leftName: 'Kansas City Chiefs', topAbbr: 'PHI', topName: 'Philadelphia Eagles' },
            setGame: vi.fn(),
            board: SAMPLE_BOARD,
            setBoard: vi.fn(),
            activePoolId: 'pool-1',
            setActivePoolId: vi.fn(),
            shareCode: 'ABCDEFGH',
            ownerId: null,
            loadingPool: false,
            dataReady: true,
            loadPoolData: vi.fn(),
            error: null,
            revision: 1,
            isActivated: true,
            isLocked: false,
            isPublished: true,
            winnerHistory: [],
            pendingMilestones: [],
            notificationDeliveryIssues: [],
            updatePool: vi.fn(),
            updatePayoutDescriptions: vi.fn(),
            updatePublishedOpenSquares: vi.fn(),
            publishPool: vi.fn(),
        }),
    };
});

vi.mock('../hooks/useLiveScoring', () => ({
    useLiveScoring: () => ({
        liveData: null,
        liveStatus: 'idle',
        isSynced: true,
        isRefreshing: false,
        lastUpdated: '',
        fetchLive: vi.fn(),
        winnerHistory: [],
        pendingMilestones: [],
    }),
}));

vi.mock('../hooks/useBoardActions', () => ({
    useBoardActions: () => ({ handlePublish: vi.fn() }),
}));

vi.mock('../hooks/useContestEntries', () => ({
    useContestEntries: () => ({ entryMetaByIndex: {}, setEntryMetaByIndex: vi.fn() }),
}));

describe('ShareModal layering on the public board viewer', () => {
    it('mounts the share dialog after the board content wrapper in document order', () => {
        render(
            <MemoryRouter initialEntries={['/b/ABCDEFGH']}>
                <Routes>
                    <Route path="/b/:shareCode" element={<BoardView />} />
                </Routes>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Share' }));

        const dialog = screen.getByRole('dialog');
        const boardWrapper = document.querySelector('[data-base="dark"] > div.flex-1.flex.flex-col.relative.z-50');

        expect(boardWrapper).not.toBeNull();

        const allElements = Array.from(document.body.querySelectorAll('*'));
        const wrapperIndex = allElements.indexOf(boardWrapper as Element);
        const dialogIndex = allElements.indexOf(dialog);

        expect(wrapperIndex).toBeGreaterThan(-1);
        expect(dialogIndex).toBeGreaterThan(-1);
        expect(dialogIndex).toBeGreaterThan(wrapperIndex);

        const position = boardWrapper!.compareDocumentPosition(dialog);
        // eslint-disable-next-line no-bitwise
        expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    });
});
