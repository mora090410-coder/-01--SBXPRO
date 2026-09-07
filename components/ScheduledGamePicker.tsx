import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import type { ScheduledGame } from '../types';
import { CapsuleButton } from '../src/design/primitives';

export interface ScheduledGamePickerProps {
    value: string | null;
    onChange: (game: ScheduledGame) => void;
    scope?: 'upcoming' | 'completed';
    limit?: number;
    accessToken?: string;
    disabled?: boolean;
    compactSelection?: boolean;
    className?: string;
}

function isScheduledGame(value: unknown): value is ScheduledGame {
    if (!value || typeof value !== 'object') return false;
    const game = value as Partial<ScheduledGame>;
    return Boolean(
        typeof game.id === 'string'
        && typeof game.kickoffAt === 'string'
        && !Number.isNaN(Date.parse(game.kickoffAt))
        && (game.state === 'pre' || game.state === 'in' || game.state === 'post')
        && typeof game.season === 'number'
        && (typeof game.week === 'number' || typeof game.week === 'string')
        && game.homeTeam
        && typeof game.homeTeam.abbr === 'string'
        && typeof game.homeTeam.name === 'string'
        && game.awayTeam
        && typeof game.awayTeam.abbr === 'string'
        && typeof game.awayTeam.name === 'string'
    );
}

function formatDate(kickoffAt: string) {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    }).format(new Date(kickoffAt));
}

function formatKickoff(kickoffAt: string) {
    return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
    }).format(new Date(kickoffAt));
}

export const ScheduledGamePicker: React.FC<ScheduledGamePickerProps> = ({
    value,
    onChange,
    scope = 'upcoming',
    limit,
    accessToken,
    disabled = false,
    compactSelection = false,
    className = '',
}) => {
    const [games, setGames] = useState<ScheduledGame[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requestKey, setRequestKey] = useState(0);
    const [browsing, setBrowsing] = useState(false);
    const [week, setWeek] = useState<string | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const focusAfterChoice = useRef(false);
    const weekId = useId();
    const selectedGame = games.find(game => game.id === value);
    const weeks = useMemo(() => [...new Map(games.map(game => [
        `${game.season}:${game.week}`, { key: `${game.season}:${game.week}`, label: `Week ${game.week}` },
    ])).values()], [games]);
    const preferredWeek = week ?? (selectedGame ? `${selectedGame.season}:${selectedGame.week}` : null);
    const activeWeek = weeks.find(item => item.key === preferredWeek)?.key ?? weeks[0]?.key;

    useEffect(() => {
        if (selectedGame && !isLoading && focusAfterChoice.current) {
            pickerRef.current?.querySelector<HTMLElement>(browsing ? 'input:checked' : 'button')?.focus();
            focusAfterChoice.current = false;
        }
    }, [selectedGame, browsing, isLoading]);

    const retry = useCallback(() => setRequestKey(key => key + 1), []);

    useEffect(() => {
        const controller = new AbortController();

        const fetchGames = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const query = new URLSearchParams({ scope });
                if (limit != null) query.set('limit', String(limit));
                const response = await fetch(`/api/nfl/games?${query}`, {
                    signal: controller.signal,
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                });
                const payload = await response.json().catch(() => null);
                if (!response.ok) {
                    throw new Error(payload?.error || payload?.message || 'The NFL schedule is unavailable.');
                }
                const candidates = Array.isArray(payload) ? payload : payload?.games;
                if (!Array.isArray(candidates)) throw new Error('The NFL schedule returned an invalid response.');
                setGames(candidates.filter(isScheduledGame));
            } catch (fetchError) {
                if (controller.signal.aborted) return;
                setGames([]);
                setError(fetchError instanceof Error ? fetchError.message : 'The NFL schedule is unavailable.');
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };

        void fetchGames();
        return () => controller.abort();
    }, [accessToken, scope, limit, requestKey]);

    const groups = useMemo(() => {
        const result = new Map<string, ScheduledGame[]>();
        games.filter(game => scope === 'completed' || `${game.season}:${game.week}` === activeWeek).forEach(game => {
            const label = `Week ${game.week} · ${formatDate(game.kickoffAt)}`;
            result.set(label, [...(result.get(label) || []), game]);
        });
        return [...result.entries()];
    }, [games, activeWeek, scope]);

    if (isLoading) {
        return (
            <div className={`space-y-3 ${className}`} aria-live="polite" aria-busy="true">
                <span className="sr-only">Loading NFL games</span>
                {[0, 1, 2].map(item => (
                    <div key={item} className="h-[78px] rounded-card border border-hairline bg-panel motion-safe:animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className={`rounded-card border border-hairline bg-panel p-5 ${className}`} role="alert">
                <p className="font-ui text-[15px] font-semibold text-tone-cardinal mb-2">Schedule unavailable</p>
                <p className="font-ui text-[14px] text-fg-2 mb-4">{error}</p>
                <CapsuleButton variant="quiet" onClick={retry}>Retry</CapsuleButton>
            </div>
        );
    }

    if (games.length === 0) {
        return (
            <div className={`rounded-card border border-hairline bg-panel p-5 ${className}`} role="status">
                <p className="font-ui text-[15px] font-semibold text-fg mb-2">
                    {scope === 'completed' ? 'No completed games found' : 'No upcoming games found'}
                </p>
                <p className="font-ui text-[14px] text-fg-2">
                    {scope === 'completed'
                        ? 'There are no recent final games available for score testing.'
                        : 'The next NFL schedule has not been posted yet. Try again when games are announced.'}
                </p>
            </div>
        );
    }

    if (compactSelection && selectedGame && !browsing) {
        return (
            <div ref={pickerRef} className={`flex flex-wrap items-center justify-between gap-4 rounded-card border border-action bg-panel p-4 ${className}`}>
                <div role="status" className="min-w-0 space-y-1">
                    <p className="font-ui text-[14px] text-fg-2">Selected game · Week {selectedGame.week}</p>
                    <p className="font-ui text-[16px] font-semibold text-fg">{selectedGame.awayTeam.name} at {selectedGame.homeTeam.name}</p>
                    <p className="font-ui text-[14px] text-fg-2">{formatDate(selectedGame.kickoffAt)} · {formatKickoff(selectedGame.kickoffAt)}</p>
                </div>
                <CapsuleButton variant="quiet" disabled={disabled} onClick={() => {
                    setWeek(`${selectedGame.season}:${selectedGame.week}`);
                    focusAfterChoice.current = true;
                    setBrowsing(true);
                }}>Change game</CapsuleButton>
            </div>
        );
    }

    return (
        <div ref={pickerRef} className={`space-y-6 ${className}`}>
            {compactSelection && selectedGame && (
                <CapsuleButton variant="quiet" disabled={disabled} onClick={() => {
                    focusAfterChoice.current = true;
                    setBrowsing(false);
                }}>Keep selected game</CapsuleButton>
            )}
            {scope !== 'completed' && weeks.length > 1 && (
                <div className="flex flex-col gap-2">
                    <label htmlFor={weekId} className="font-ui text-[14px] text-fg-2">NFL week</label>
                    <select id={weekId} value={activeWeek} disabled={disabled} onChange={event => setWeek(event.target.value)}
                        className="h-12 w-full rounded-control border border-hairline bg-panel px-4 font-ui text-[16px] text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">
                        {weeks.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                    </select>
                </div>
            )}
            {groups.map(([label, groupGames]) => (
                <fieldset key={label} className="space-y-2">
                    <legend className="font-mono uppercase text-[12px] leading-none tracking-[0.12em] text-fg-3 mb-3">{label}</legend>
                    {groupGames.map(game => {
                        const selected = value === game.id;
                        return (
                            <label
                                key={game.id}
                                className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 min-h-[76px] rounded-card border p-4 cursor-pointer transition-colors duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] focus-within:ring-2 focus-within:ring-action ${
                                    selected
                                        ? 'border-action bg-panel-hover'
                                        : 'border-hairline bg-panel hover:bg-panel-hover'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="scheduled-game"
                                    value={game.id}
                                    checked={selected}
                                    disabled={disabled}
                                    onChange={() => {
                                        focusAfterChoice.current = compactSelection;
                                        setBrowsing(false);
                                        onChange(game);
                                    }}
                                    className="h-5 w-5 accent-action"
                                />
                                <span className="min-w-0">
                                    <span className="block font-ui text-[16px] font-medium text-fg leading-tight">
                                        {game.awayTeam.abbr} <span className="text-fg-3">at</span> {game.homeTeam.abbr}
                                    </span>
                                    <span className="block truncate font-ui text-[14px] text-fg-2">
                                        {game.awayTeam.name} at {game.homeTeam.name}
                                    </span>
                                </span>
                                <span className="font-mono text-[12px] whitespace-nowrap text-fg-2">
                                    {formatKickoff(game.kickoffAt)}
                                </span>
                            </label>
                        );
                    })}
                </fieldset>
            ))}
        </div>
    );
};

export default ScheduledGamePicker;
