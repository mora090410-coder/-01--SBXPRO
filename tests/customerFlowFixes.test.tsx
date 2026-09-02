import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import RequireAuth from '../components/auth/RequireAuth';
import ShareModal from '../components/board/ShareModal';
import Paid from '../pages/Paid';

const mocks = vi.hoisted(() => ({
    authState: { user: null as null | { id: string }, loading: false },
    getSession: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        ...mocks.authState,
        session: null,
        signOut: vi.fn(),
    }),
}));

vi.mock('../services/supabase', () => ({
    supabase: {
        auth: {
            getSession: mocks.getSession,
        },
    },
}));

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    mocks.authState.user = null;
    mocks.authState.loading = false;
});

describe('customer flow regressions', () => {
    it('preserves the protected path and query when redirecting to login', () => {
        const LocationProbe = () => {
            const location = useLocation();
            return <output>{`${location.pathname}${location.search}`}</output>;
        };

        render(
            <MemoryRouter initialEntries={['/create?scoreTest=1']}>
                <Routes>
                    <Route
                        path="/create"
                        element={<RequireAuth><div>Private</div></RequireAuth>}
                    />
                    <Route path="/login" element={<LocationProbe />} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText('/login?mode=signup&returnTo=%2Fcreate%3FscoreTest%3D1')).toBeInTheDocument();
    });

    it('does not claim a link was copied when clipboard permission is denied', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
        });

        render(<ShareModal shareUrl="https://example.test/b/ABCDEFGH" onClose={() => undefined} />);
        fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('could not be copied');
        expect(screen.queryByText('Copied')).not.toBeInTheDocument();
    });

    it('offers sign-in with the exact checkout return URL when the session expired', async () => {
        mocks.getSession.mockResolvedValue({ data: { session: null } });

        render(
            <MemoryRouter initialEntries={['/paid?order=order-123']}>
                <Paid />
            </MemoryRouter>,
        );

        const link = await screen.findByRole('link', { name: 'Sign in to continue' });
        expect(link).toHaveAttribute(
            'href',
            '/login?returnTo=%2Fpaid%3Forder%3Dorder-123',
        );
    });

    it('retries transient billing failures and supports a manual recheck', async () => {
        vi.useFakeTimers();
        mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Temporary failure' }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' },
            }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                paymentConfirmed: true,
                entitlementStatus: 'active',
                contestId: 'contest-1',
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }));
        vi.stubGlobal('fetch', fetchMock);

        const transientRender = render(
            <MemoryRouter initialEntries={['/paid?order=order-123']}>
                <Paid />
            </MemoryRouter>,
        );

        await act(async () => {
            await Promise.resolve();
            await vi.advanceTimersByTimeAsync(2100);
        });
        expect(screen.getByRole('link', { name: 'Open organizer view' })).toHaveAttribute(
            'href',
            '/boards/contest-1',
        );
        transientRender.unmount();

        vi.useRealTimers();
        fetchMock.mockReset()
            .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Order unavailable' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                paymentConfirmed: true,
                entitlementStatus: 'active',
                contestId: 'contest-2',
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }));

        render(
            <MemoryRouter initialEntries={['/paid?order=order-456']}>
                <Paid />
            </MemoryRouter>,
        );
        const retry = await screen.findByRole('button', { name: 'Check again' });
        fireEvent.click(retry);
        await waitFor(() => expect(
            screen.getByRole('link', { name: 'Open organizer view' }),
        ).toHaveAttribute('href', '/boards/contest-2'));
    });

    it('plainly distinguishes a delayed payment from a failed checkout', async () => {
        mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({
                orderStatus: 'awaiting_payment',
                activated: false,
                contestId: 'contest-1',
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                orderStatus: 'failed',
                activated: false,
                contestId: 'contest-1',
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }));
        vi.stubGlobal('fetch', fetchMock);

        const delayed = render(
            <MemoryRouter initialEntries={['/paid?order=order-delayed']}>
                <Paid />
            </MemoryRouter>,
        );
        expect(await screen.findByText(/payment is still processing/i)).toBeInTheDocument();
        expect(screen.getByText(/do not start another checkout/i)).toBeInTheDocument();
        delayed.unmount();

        render(
            <MemoryRouter initialEntries={['/paid?order=order-failed']}>
                <Paid />
            </MemoryRouter>,
        );
        expect(await screen.findByText(/payment did not complete/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Return to dashboard' })).toBeInTheDocument();
    });

    it('surfaces a duplicate payment for refund review instead of implying another pass was granted', async () => {
        mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            orderStatus: 'duplicate_paid',
            activated: false,
            contestId: 'contest-1',
            refundable: true,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })));

        render(
            <MemoryRouter initialEntries={['/paid?order=order-duplicate']}>
                <Paid />
            </MemoryRouter>,
        );

        expect(await screen.findByText(/second payment was received/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Refund review.' })).toBeInTheDocument();
        expect(screen.queryByText(/board unlocked/i)).not.toBeInTheDocument();
    });

    it('does not call an active replacement pass inactive when an older payment is refunded', async () => {
        mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            orderStatus: 'refunded',
            activated: false,
            contestId: 'contest-1',
            entitlementStatus: 'active',
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })));

        render(
            <MemoryRouter initialEntries={['/paid?order=order-refunded']}>
                <Paid />
            </MemoryRouter>,
        );

        expect(await screen.findByText(/current plan remains active/i)).toBeInTheDocument();
        expect(screen.queryByText(/plan is inactive/i)).not.toBeInTheDocument();
    });
});
