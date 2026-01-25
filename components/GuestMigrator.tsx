import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGuest } from '../context/GuestContext';
import { usePoolData } from '../hooks/usePoolData';
import { useNavigate } from 'react-router-dom';

export const GuestMigrator: React.FC = () => {
    const { user } = useAuth();
    const { guestBoard, clearGuestBoard } = useGuest();
    const { syncGuestBoardToSupabase } = usePoolData();
    const navigate = useNavigate();
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Only run if we have a user, a guest board with passcode, and aren't already syncing
        if (!user || !guestBoard || !guestBoard.adminPasscode || isSyncing) return;

        const performSync = async () => {
            console.log("GuestMigrator: Found guest board and authenticated user. Syncing...");
            setIsSyncing(true);
            try {
                const newId = await syncGuestBoardToSupabase(
                    guestBoard.game,
                    guestBoard.board,
                    user.id,
                    guestBoard.adminPasscode
                );

                if (newId) {
                    console.log("Migration successful, redirecting to:", newId);
                    clearGuestBoard();
                    // Use the existing query param pattern if that's what App.tsx expects, 
                    // or the path pattern if configured. App.tsx checks ?poolId=
                    navigate(`/?poolId=${newId}`);
                }
            } catch (err) {
                console.error("Migration failed:", err);
                // In a production app, we should show a toast or error modal here
                // For now, allow retry if they refresh/re-trigger
            } finally {
                setIsSyncing(false);
            }
        };

        performSync();
    }, [user, guestBoard, syncGuestBoardToSupabase, clearGuestBoard, navigate]);
    // Intentionally excluded isSyncing from deps to prevent loops, though the check at top handles it.

    if (isSyncing) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
                <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#FFC72C] border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-[#FFC72C] text-2xl font-black uppercase tracking-tight mb-2">Creating Board...</div>
                    <div className="text-gray-400 text-sm font-medium">Please wait while we initialize your dashboard.</div>
                </div>
            </div>
        );
    }

    return null;
};
