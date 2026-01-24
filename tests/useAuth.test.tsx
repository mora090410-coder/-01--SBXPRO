/**
 * useAuth Hook Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';

import { AuthProvider } from '../context/AuthContext';
import React from 'react';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

vi.mock('../services/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            signOut: vi.fn()
        }
    }
}));

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useAuth', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        localStorageMock.clear();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children} </AuthProvider>
    );

    it('should initialize with null adminToken', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current).not.toBeNull();
            expect(result.current.adminToken).toBeNull();
        });

        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isLoggingIn).toBe(false);
        expect(result.current.authError).toBeNull();
    });

    it('should load adminToken from localStorage', async () => {
        localStorageMock.setItem('sbx_adminToken', 'stored-token');

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current).not.toBeNull();
            expect(result.current.adminToken).toBe('stored-token');
        });
        expect(result.current.isAdmin).toBe(true);
    });

    it('should set adminToken and save to localStorage', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current).not.toBeNull());

        act(() => {
            result.current.setAdminToken('new-token');
        });

        expect(result.current.adminToken).toBe('new-token');
        expect(localStorageMock.getItem('sbx_adminToken')).toBe('new-token');
    });

    it('should clear adminToken on logout', async () => {
        localStorageMock.setItem('sbx_adminToken', 'stored-token');
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current).not.toBeNull());

        act(() => {
            result.current.logout();
        });

        expect(result.current.adminToken).toBeNull();
        expect(localStorageMock.getItem('sbx_adminToken')).toBeNull();
    });

    it('should handle login success', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true, poolId: 'ABC123' })
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current).not.toBeNull());

        let loginResult: any;
        await act(async () => {
            loginResult = await result.current.login('Test League', 'password123');
        });

        expect(loginResult.success).toBe(true);
        expect(loginResult.poolId).toBe('ABC123');
    });

    it('should handle login failure', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ message: 'Invalid credentials' })
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current).not.toBeNull());

        let loginResult: any;
        await act(async () => {
            loginResult = await result.current.login('Test League', 'wrongpass');
        });

        expect(loginResult.success).toBe(false);
        expect(loginResult.error).toBe('Invalid credentials');
        expect(result.current.authError).toBe('Invalid credentials');
    });

    it('should clear auth error', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current).not.toBeNull());

        act(() => {
            result.current.clearAuthError();
        });

        expect(result.current.authError).toBeNull();
    });
});
