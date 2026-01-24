/**
 * usePoolData Hook Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePoolData, INITIAL_GAME, EMPTY_BOARD } from '../hooks/usePoolData';

// Mock Supabase
const { mockFrom, mockSelect, mockEq, mockSingle } = vi.hoisted(() => {
    const mockSingle = vi.fn();
    const mockEq = vi.fn(() => ({ single: mockSingle }));
    const mockSelect = vi.fn(() => ({ eq: mockEq }));
    const mockFrom = vi.fn(() => ({ select: mockSelect, insert: vi.fn(), update: vi.fn() }));
    return { mockFrom, mockSelect, mockEq, mockSingle };
});

vi.mock('../services/supabase', () => ({
    supabase: {
        from: mockFrom,
        auth: {
            getUser: vi.fn()
        }
    }
}));

describe('usePoolData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default valid chain setup
        mockFrom.mockReturnValue({
            select: mockSelect,
            insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'NEW123' }, error: null }) }) }),
            update: () => ({ eq: () => Promise.resolve({ error: null }) })
        });
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ single: mockSingle });
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => usePoolData());

        expect(result.current.game).toEqual(INITIAL_GAME);
        expect(result.current.board).toEqual(EMPTY_BOARD);
        expect(result.current.activePoolId).toBeNull();
        expect(result.current.loadingPool).toBe(true);
        expect(result.current.dataReady).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should load pool data successfully', async () => {
        const mockData = {
            id: 'TEST123',
            owner_id: 'owner_1',
            settings: { ...INITIAL_GAME, title: 'Test League' },
            board_data: EMPTY_BOARD
        };

        mockSingle.mockResolvedValueOnce({ data: mockData, error: null });

        const { result } = renderHook(() => usePoolData());

        await act(async () => {
            await result.current.loadPoolData('TEST123');
        });

        expect(result.current.activePoolId).toBe('TEST123');
        expect(result.current.game.title).toBe('Test League');
        expect(result.current.loadingPool).toBe(false);
        expect(result.current.dataReady).toBe(true);
    });

    it('should handle pool not found error', async () => {
        mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Pool not found' } });

        const { result } = renderHook(() => usePoolData());

        await act(async () => {
            await result.current.loadPoolData('INVALID');
        });

        expect(result.current.error).toBe('Pool not found');
        expect(result.current.loadingPool).toBe(false);
    });

    it('should update game state', () => {
        const { result } = renderHook(() => usePoolData());

        act(() => {
            result.current.setGame(prev => ({ ...prev, title: 'New Title' }));
        });

        expect(result.current.game.title).toBe('New Title');
    });

    it('should clear error', () => {
        const { result } = renderHook(() => usePoolData());

        // Simulate an error state
        act(() => {
            result.current.clearError();
        });

        expect(result.current.error).toBeNull();
    });
});

describe('INITIAL_GAME', () => {
    it('should have required properties', () => {
        expect(INITIAL_GAME).toHaveProperty('title');
        expect(INITIAL_GAME).toHaveProperty('leftAbbr');
        expect(INITIAL_GAME).toHaveProperty('topAbbr');
        expect(INITIAL_GAME).toHaveProperty('dates');
    });
});

describe('EMPTY_BOARD', () => {
    it('should have 100 squares', () => {
        expect(EMPTY_BOARD.squares).toHaveLength(100);
    });

    it('should have axis arrays of length 10', () => {
        expect(EMPTY_BOARD.bearsAxis).toHaveLength(10);
        expect(EMPTY_BOARD.oppAxis).toHaveLength(10);
    });
});
