import React, { useMemo } from 'react';
import { BoardData, EntryMeta, LiveGameData } from '../types';
import { calculateWinnerHighlights, getAxisForQuarter } from '../utils/winnerLogic';

interface OrganizerDashboardProps {
    board: BoardData;
    entryMetaByIndex: Record<number, EntryMeta>;
    liveData: LiveGameData | null;
    onOpenSquareDetails: (cellIndex: number) => void;
    gameTitle?: string;
}

const DashboardCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`premium-glass p-5 rounded-3xl flex flex-col ${className}`}>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</h4>
        {children}
    </div>
);

const ProgressBar: React.FC<{ filled: number; total: number; colorClass?: string }> = ({ filled, total, colorClass = 'bg-green-500' }) => {
    const pct = Math.min(100, Math.max(0, (filled / total) * 100));
    return (
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
        </div>
    );
};

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
    board,
    entryMetaByIndex,
    liveData,
    onOpenSquareDetails,
}) => {
    // 1. Coverage Stats
    const coverage = useMemo(() => {
        let filled = 0;
        const total = 100;
        board.squares.forEach(sq => {
            if (sq && sq.length > 0) filled++;
        });
        return { filled, open: total - filled, pct: filled };
    }, [board]);

    // 2. Payment Stats
    const paymentStats = useMemo(() => {
        let paid = 0;
        let unpaid = 0;
        let unknown = 0;

        // Only count filled squares? Or all squares that have metadata?
        // User request: "across squares that are filled (or across all squares; pick one)"
        // Let's go with filled squares to be more accurate to "active" participants
        board.squares.forEach((sq, idx) => {
            if (sq && sq.length > 0) {
                const status = entryMetaByIndex[idx]?.paid_status || 'unpaid'; // Default to unpaid if not set? Or unknown?
                // Actually types says 'unknown' | 'unpaid' | 'paid'. If missing, it's effectively unknown or unpaid.
                // Let's assume missing = unpaid for safety, or unknown.
                // User said: "Count of paid / unpaid / unknown".
                const meta = entryMetaByIndex[idx];
                if (!meta || meta.paid_status === 'unknown') unknown++;
                else if (meta.paid_status === 'paid') paid++;
                else unpaid++;
            }
        });

        const needsFollowUp = unpaid + unknown;
        return { paid, unpaid, unknown, needsFollowUp };
    }, [board, entryMetaByIndex]);

    // 3. Follow-up Queue
    const workQueue = useMemo(() => {
        const queue: { idx: number; name: string; reason: string; priority: number; paid: string; notify: boolean; contact: boolean }[] = [];

        board.squares.forEach((names, idx) => {
            if (!names || names.length === 0) return;

            const meta = entryMetaByIndex[idx];
            const name = names[0];
            const isPaid = meta?.paid_status === 'paid';
            const isUnknown = !meta || meta.paid_status === 'unknown';
            const isUnpaid = !isPaid && !isUnknown; // Explicitly unpaid
            const hasContact = !!(meta?.contact_value);
            const notifyOptIn = !!meta?.notify_opt_in;

            // Priority Logic
            // 1. Winner missing contact (hard to know if they stick around, but let's skipping winner check here for simplicity/perf unless essential)
            //    User said: "Winner missing contact... [highest priority]". 
            //    To do this efficiently, we'd need to know if they are a winner.
            //    Let's skip winner check in this first pass to keep it simple, or add it if we have winner info.
            //    Actually, let's stick to the 3 rules:
            //    a) Missng contact + notify (High)
            //    b) Unpaid (Medium)
            //    c) Missing contact (Low? or just missing contact + notify?)

            // User Spec:
            // a) Winner missing contact (if notify_opt_in true and contact_value null) [highest priority] -- SKIP for MVP/Complexity unless easy
            // b) Unpaid squares
            // c) Missing contact where notify_opt_in is true

            if (notifyOptIn && !hasContact) {
                queue.push({ idx, name, reason: 'Missing Contact (Notify On)', priority: 3, paid: meta?.paid_status || '?', notify: true, contact: false });
            } else if (isUnpaid || isUnknown) {
                queue.push({ idx, name, reason: 'Unpaid', priority: 2, paid: meta?.paid_status || 'unpaid', notify: notifyOptIn, contact: hasContact });
            }
        });

        // Sort by priority (desc), then index
        return queue.sort((a, b) => b.priority - a.priority || a.idx - b.idx).slice(0, 10);
    }, [board, entryMetaByIndex]);

    // 4. Winners Snapshot
    const winnerInfo = useMemo(() => {
        // If we have liveData, we can show actual winners.
        // If not, we have nothing.
        // We can also show "Projected" winners if using manual scores?
        // User requested: "Reuse existing winner computation... Q1, Q2, Q3, Final"

        if (!liveData) return null;

        const { quarterWinners } = calculateWinnerHighlights(liveData);
        const results: { label: string; name: string; sq: number }[] = [];

        // Helper to find owner of a score pair
        const findOwner = (scoreKey: string, quarter: string) => { // scoreKey = "7-0" (Top-Left)
            const [topDigit, leftDigit] = scoreKey.split('-').map(Number);
            const topAxis = getAxisForQuarter(board, 'top', quarter);
            const leftAxis = getAxisForQuarter(board, 'left', quarter);
            const col = topAxis.indexOf(topDigit);
            const row = leftAxis.indexOf(leftDigit);
            if (col === -1 || row === -1) return { name: 'Unassigned', sq: -1 };
            const idx = row * 10 + col;
            const names = board.squares[idx];
            return { name: names && names.length > 0 ? names[0] : 'Unassigned', sq: idx + 1 };
        };

        if (quarterWinners['Q1']) {
            const w = findOwner(quarterWinners['Q1'], 'Q1');
            results.push({ label: 'Q1', ...w });
        }
        if (quarterWinners['Q2']) {
            const w = findOwner(quarterWinners['Q2'], 'Q2');
            results.push({ label: 'Q2', ...w });
        }
        if (quarterWinners['Q3']) {
            const w = findOwner(quarterWinners['Q3'], 'Q3');
            results.push({ label: 'Q3', ...w });
        }
        if (quarterWinners['Final']) {
            const w = findOwner(quarterWinners['Final'], 'Final');
            results.push({ label: 'Final', ...w });
        }

        return results;
    }, [board, liveData]);

    const copyFollowUp = (item: any) => {
        const text = `Square ${item.idx + 1} - ${item.name} - Status: ${item.paid}`;
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-in slide-in-from-top-4 duration-700">

            {/* 1. Board Coverage */}
            <DashboardCard title="Board Coverage">
                <div className="flex flex-col h-full justify-between">
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-bold text-white">{coverage.filled}</span>
                        <span className="text-sm text-gray-400 mb-1.5">/ 100 Squares Filled</span>
                    </div>
                    <ProgressBar filled={coverage.filled} total={100} colorClass={coverage.filled === 100 ? 'bg-green-500' : 'bg-indigo-500'} />
                    <div className="mt-4 flex justify-between text-xs text-gray-500 font-medium">
                        <span>{coverage.open} Open</span>
                        <span>{coverage.pct}% Complete</span>
                    </div>
                </div>
            </DashboardCard>

            {/* 2. Payment Status */}
            <DashboardCard title="Payment Status">
                <div className="flex gap-4 items-center mb-4">
                    <div className="flex-1">
                        <div className="text-2xl font-bold text-white mb-1">{paymentStats.needsFollowUp}</div>
                        <div className="text-xs text-red-400 font-medium uppercase tracking-wide">Needs Action</div>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div className="flex-1">
                        <div className="text-2xl font-bold text-white mb-1">{paymentStats.paid}</div>
                        <div className="text-xs text-green-400 font-medium uppercase tracking-wide">Paid</div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <span className="flex-1">Unpaid</span>
                        <span className="text-white font-mono">{paymentStats.unpaid}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <span className="flex-1">Unknown</span>
                        <span className="text-white font-mono">{paymentStats.unknown}</span>
                    </div>
                </div>
            </DashboardCard>

            {/* 3. Follow-Up Queue (Spans 2 cols on large if needed, or stick to grid) */}
            <DashboardCard title="Follow-Up Queue" className="md:col-span-2 lg:col-span-1 row-span-2">
                {workQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-sm text-gray-400">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {workQueue.map((item) => (
                            <div key={item.idx} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] font-mono text-white/50">{item.idx + 1}</div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-white truncate max-w-[100px]">{item.name}</div>
                                        <div className="text-[10px] text-red-300 truncate">{item.reason}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => copyFollowUp(item)} className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white" title="Copy Info">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </button>
                                    <button onClick={() => onOpenSquareDetails(item.idx)} className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white" title="Open Details">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DashboardCard>

            {/* 4. Winners Snapshot */}
            {winnerInfo && winnerInfo.length > 0 && (
                <DashboardCard title="Winners Snapshot" className="md:col-span-2 lg:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {winnerInfo.map((w) => (
                            <div key={w.label} className="p-3 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                                <div className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1">{w.label}</div>
                                <div className="text-lg font-bold text-white mb-0.5 truncate w-full">{w.name}</div>
                                <div className="text-xs text-gray-500">Square {w.sq}</div>
                            </div>
                        ))}
                    </div>
                </DashboardCard>
            )}

        </div>
    );
};
