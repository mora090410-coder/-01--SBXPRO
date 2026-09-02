import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/image';
import { parseBoardImage } from '../services/boardImportService';
import { GameState, BoardData, ScheduledGame } from '../types';
import { INITIAL_GAME, EMPTY_BOARD } from '../hooks/usePoolData';
import ScheduledGamePicker from '../components/ScheduledGamePicker';
import { Base, CapsuleButton, Eyebrow, Glass, CapsuleInput } from '../src/design/primitives';

const CAPSULE_LINK = 'inline-flex items-center justify-center gap-2 rounded-capsule bg-panel border border-hairline px-5 h-11 font-ui text-[15px] font-semibold leading-none text-fg transition-colors hover:bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-ground active:scale-[0.98]';

const CreateContest: React.FC = () => {
    const { user, session, signOut } = useAuth();
    const navigate = useNavigate();
    const requestedScoreTestMode = new URLSearchParams(window.location.search).get('scoreTest') === '1';
    const [scoreTestMode, setScoreTestMode] = useState(false);

    const [game, setGame] = useState<GameState>(() => ({
        ...INITIAL_GAME,
        gameExternalId: undefined,
        kickoffAt: undefined,
        leftAbbr: '',
        leftName: '',
        topAbbr: '',
        topName: '',
        dates: '',
    }));
    const [board, setBoard] = useState<BoardData>(EMPTY_BOARD);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scanSuccess, setScanSuccess] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Restore the draft if the user was redirected away from /create for auth.
    useEffect(() => {
        const savedGame = sessionStorage.getItem('gridone_draft_game');
        const savedBoard = sessionStorage.getItem('gridone_draft_board');
        if (savedGame) {
            try { setGame(JSON.parse(savedGame)); } catch { /* corrupt data */ }
            sessionStorage.removeItem('gridone_draft_game');
        }
        if (savedBoard) {
            try { setBoard(JSON.parse(savedBoard)); } catch { /* corrupt data */ }
            sessionStorage.removeItem('gridone_draft_board');
        }
    }, []); // Run once on mount

    useEffect(() => {
        const accessToken = session?.access_token;
        if (!requestedScoreTestMode || !accessToken) {
            setScoreTestMode(false);
            return;
        }
        const controller = new AbortController();
        void fetch('/api/nfl/games?scope=completed&limit=1', {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then(async response => response.ok ? response.json() : null)
            .then(data => setScoreTestMode(data?.scoreTestMode === true))
            .catch(error => {
                if (error instanceof Error && error.name === 'AbortError') return;
                setScoreTestMode(false);
            });
        return () => controller.abort();
    }, [requestedScoreTestMode, session?.access_token]);

    const handleGameChange = (scheduledGame: ScheduledGame) => {
        setGame(prev => ({
            ...prev,
            gameExternalId: scheduledGame.id,
            kickoffAt: scheduledGame.kickoffAt,
            // ESPN's away team is the board's left axis; home is the top axis.
            leftAbbr: scheduledGame.awayTeam.abbr,
            leftName: scheduledGame.awayTeam.name,
            topAbbr: scheduledGame.homeTeam.abbr,
            topName: scheduledGame.homeTeam.name,
            // Legacy read compatibility only. The provider kickoff remains canonical.
            dates: scheduledGame.kickoffAt.slice(0, 10),
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setError(null);
        setScanSuccess(false);

        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const rawBase64 = ev.target!.result as string;
                const compressed = await compressImage(rawBase64);
                setGame(p => ({ ...p, coverImage: compressed }));

                const scannedBoard = await parseBoardImage(compressed);
                setBoard(scannedBoard);
                setScanSuccess(true);
            } catch (err: any) {
                console.warn("Scan failed", err);
                setError("Image processed, but grid scan failed: " + (err.message || "Invalid format"));
                setScanSuccess(false);
            } finally {
                setIsScanning(false);
            }
        };
        reader.onerror = () => {
            setError("Failed to read file.");
            setIsScanning(false);
        };
        reader.readAsDataURL(file);
    };

    const createBoard = async (manualBoard?: BoardData) => {
        const finalBoard = manualBoard || board;
        const leagueTitle = game.title?.trim();

        if (!user) {
            try {
                sessionStorage.setItem('gridone_draft_game', JSON.stringify(game));
                sessionStorage.setItem('gridone_draft_board', JSON.stringify(finalBoard));
            } catch {
                // sessionStorage unavailable — the draft is lost on redirect
            }
            const returnTo = encodeURIComponent(requestedScoreTestMode ? '/create?scoreTest=1' : '/create');
            navigate(`/login?mode=signup&returnTo=${returnTo}`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (!leagueTitle) throw new Error("League Name is required.");
            if (!game.gameExternalId) throw new Error("Select an NFL game before creating your board.");
            if (!session?.access_token) throw new Error("You must be logged in to create a board.");

            const response = await fetch('/api/pools', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    scoreTestMode,
                    game: { ...game, title: leagueTitle },
                    board: finalBoard,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.error || 'Failed to create contest.');
            if (!data.poolId) throw new Error("No data returned from create flow.");

            navigate(`/boards/${data.poolId}`);
        } catch (err: any) {
            console.error("Publish Error:", err);
            setError(err.message || "Failed to create contest.");
        } finally {
            setIsLoading(false);
        }
    };

    const canCreate = Boolean(game.title?.trim()) && Boolean(game.gameExternalId);

    return (
        <Base kind="cream">
            <main aria-label="New board" className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-10 md:px-8 md:py-14">

                <header className="flex items-center justify-between gap-4">
                    <Link to="/dashboard" className={CAPSULE_LINK}>Your boards</Link>
                    <CapsuleButton variant="ghost" onClick={() => void signOut?.()}>Log out</CapsuleButton>
                </header>

                {error && (
                    <Glass role="alert" className="flex flex-wrap items-center justify-between gap-3 font-ui text-[15px] text-tone-cardinal">
                        <span className="min-w-0">{error}</span>
                        {error.includes('overloaded') && (
                            <CapsuleButton variant="quiet" onClick={() => void createBoard()}>Retry</CapsuleButton>
                        )}
                    </Glass>
                )}

                <div className="flex flex-col gap-3">
                    <Eyebrow>New board</Eyebrow>
                    <h1 className="font-display text-[40px] leading-[1] tracking-[-0.01em] text-fg md:text-[52px]">Name your board</h1>
                </div>

                <CapsuleInput
                    id="board-name"
                    label="Board name"
                    type="text"
                    maxLength={100}
                    value={game.title}
                    onChange={(e) => setGame(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Lincoln Softball Booster Board"
                    autoFocus
                />

                <section aria-labelledby="pick-the-game" className="flex flex-col gap-4">
                    <h2 id="pick-the-game" className="font-display text-[26px] leading-[1.05] text-fg">Pick the game</h2>

                    {scoreTestMode && (
                        <Glass role="status" className="flex flex-col gap-1">
                            <p className="font-ui text-[15px] font-semibold text-fg">Completed-game score test</p>
                            <p className="font-ui text-[14px] text-fg-2">This test mode shows only the five most recent final games.</p>
                        </Glass>
                    )}

                    <ScheduledGamePicker
                        value={game.gameExternalId || null}
                        onChange={handleGameChange}
                        scope={scoreTestMode ? 'completed' : 'upcoming'}
                        limit={scoreTestMode ? 5 : undefined}
                        accessToken={scoreTestMode ? session?.access_token : undefined}
                    />
                </section>

                <CapsuleButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={!canCreate || isLoading}
                    onClick={() => void createBoard()}
                >
                    {isLoading ? 'Creating board…' : 'Create board'}
                </CapsuleButton>

                <section aria-labelledby="paper-import" className="flex flex-col gap-3 border-t border-hairline pt-6">
                    <h2 id="paper-import" className="font-ui text-[17px] font-semibold text-fg">Import a paper board photo</h2>
                    <p className="font-ui text-[14px] text-fg-2">Already started on paper? Add a photo and the names are read into the board. You review every square before publishing.</p>
                    <label htmlFor="board-photo" className="font-ui text-[14px] text-fg-2">Board photo (JPG, PNG, or WebP)</label>
                    <input
                        id="board-photo"
                        type="file"
                        ref={fileRef}
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleFileUpload}
                        disabled={isScanning || isLoading}
                        className="min-h-11 w-full rounded-control border border-hairline bg-panel px-4 py-3 font-ui text-[15px] text-fg file:mr-4 file:h-9 file:rounded-capsule file:border-0 file:bg-action file:px-4 file:font-ui file:text-[14px] file:font-semibold file:text-action-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-ground"
                    />
                    {isScanning && (
                        <p role="status" className="font-ui text-[14px] text-fg-2">Reading the board photo…</p>
                    )}
                    {scanSuccess && !isScanning && (
                        <p role="status" className="font-ui text-[14px] text-fg-2">Names read from the photo. Create the board to review them.</p>
                    )}
                </section>
            </main>
        </Base>
    );
};

export default CreateContest;
