
import React from 'react';
import { GameState, LiveGameData, BoardData, WinnerHighlights } from '../types';

const getLogoUrl = (abbr: string) => {
  const code = abbr.toLowerCase() === 'was' ? 'wsh' : abbr.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${code}.png`;
};

const Scoreboard: React.FC<{ 
  game: GameState; 
  live: LiveGameData | null; 
  onRefresh?: () => void;
  isRefreshing?: boolean;
  liveStatus?: string;
}> = ({ game, live, onRefresh, isRefreshing, liveStatus }) => {
  const isOvertime = live?.period && live.period > 4;
  const isFinal = live?.state === 'post';
  const finalHeader = isOvertime ? 'Final/OT' : 'Final';

  const getSquaresDigit = (team: 'left' | 'top', checkpoint: string) => {
    if (!live || live.isManual) return '—';
    const { period, state, quarterScores, leftScore, topScore } = live;

    if (checkpoint === 'Final') {
      if (state === 'post' || period >= 4) {
        return (team === 'left' ? leftScore : topScore) % 10;
      }
      return '—';
    }

    const qNum = parseInt(checkpoint.slice(1));
    if (state !== 'post' && period < qNum) return '—';
    if (state === 'in' && period === qNum) {
      return (team === 'left' ? leftScore : topScore) % 10;
    }

    let cumulativeTotal = 0;
    for (let i = 1; i <= qNum; i++) {
      const qKey = `Q${i}` as keyof typeof quarterScores;
      cumulativeTotal += quarterScores[qKey][team];
    }
    
    return cumulativeTotal % 10;
  };

  return (
    <div className="p-6 flex flex-col justify-between rounded-2xl shadow-lg border border-white/10"
         style={{ background: `linear-gradient(135deg, rgba(var(--left-rgb), 0.6) 0%, rgba(var(--top-rgb), 0.6) 100%)` }}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h4 className="text-lg font-black uppercase tracking-tight line-clamp-1 flex items-center gap-2 drop-shadow-md"
              style={{ color: 'var(--text-contrast-left)' }}>
            {game.title || `${game.leftAbbr} vs ${game.topAbbr}`}
            {live?.isManual && (
              <span className="text-[10px] bg-red-900/40 px-2 py-0.5 rounded border border-red-500/20"
                    style={{ color: 'white' }}>MANUAL</span>
            )}
          </h4>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-80"
             style={{ color: 'var(--text-contrast-left)' }}>{game.meta}</p>
        </div>
        <div className="flex items-center gap-3">
          {live && (
            <div className="font-black text-[10px] uppercase bg-black/30 border border-white/20 px-2 py-1 rounded tracking-widest shadow-sm"
                 style={{ color: 'var(--text-contrast-top)' }}>
              {live.state === 'post' ? 'Final' : (live.isOvertime ? `OT ${live.clock}` : (live.detail || live.clock))}
            </div>
          )}
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-lg bg-black/20 border border-white/20 hover:bg-black/40 transition-all ${isRefreshing ? 'animate-spin opacity-50' : ''}`}
            title="Refresh Live Scores"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-contrast-top)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {!game.dates && !live?.isManual && (
        <div className="mb-4 p-3 bg-black/40 border border-white/10 rounded-lg text-center backdrop-blur-sm">
          <p className="text-[10px] font-black text-white uppercase tracking-widest">
            Game Date Not Set
          </p>
          <p className="text-[9px] text-gray-300 font-bold uppercase mt-1">
            Organizer must set a date to enable live scores.
          </p>
        </div>
      )}

      <div className="mb-2 text-[9px] font-black uppercase tracking-widest text-center opacity-60"
           style={{ color: 'var(--text-contrast-left)' }}>
        Squares Scoreboard (Last Digit)
      </div>

      <table className="w-full text-center border-separate border-spacing-x-2 md:border-spacing-x-4">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-widest">
            <th className="text-left py-2 font-bold" style={{ color: 'var(--text-contrast-left)' }}>Team</th>
            <th className="w-12" style={{ color: 'var(--text-contrast-left)' }}>Q1</th>
            <th className="w-12" style={{ color: 'var(--text-contrast-left)' }}>Q2</th>
            <th className="w-12" style={{ color: 'var(--text-contrast-left)' }}>Q3</th>
            <th className="w-16" style={{ color: 'var(--text-contrast-top)' }}>{finalHeader}</th>
          </tr>
        </thead>
        <tbody className="text-base">
          <tr className="border-t border-white/20">
            <td className="py-4 text-left font-black uppercase tracking-tighter text-lg flex items-center gap-3 drop-shadow-sm"
                style={{ color: 'var(--text-contrast-left)' }}>
              <img src={getLogoUrl(game.leftAbbr)} alt={game.leftAbbr} className="w-8 h-8 object-contain drop-shadow-md" onError={(e) => (e.currentTarget.style.display = 'none')} />
              {game.leftAbbr}
            </td>
            <td className="font-black text-xl" style={{ color: 'var(--text-contrast-left)' }}>{getSquaresDigit('left', 'Q1')}</td>
            <td className="font-black text-xl" style={{ color: 'var(--text-contrast-left)' }}>{getSquaresDigit('left', 'Q2')}</td>
            <td className="font-black text-xl" style={{ color: 'var(--text-contrast-left)' }}>{getSquaresDigit('left', 'Q3')}</td>
            <td className={`font-black text-xl transition-transform ${isFinal ? 'scale-110 drop-shadow-sm' : ''}`}
                style={{ color: 'var(--text-contrast-top)' }}>
              {live?.isManual ? (live.leftScore % 10) : getSquaresDigit('left', 'Final')}
            </td>
          </tr>
          <tr className="border-t border-white/20">
            <td className="py-4 text-left font-black uppercase tracking-tighter text-lg flex items-center gap-3 drop-shadow-sm"
                style={{ color: 'var(--text-contrast-left)' }}>
              <img src={getLogoUrl(game.topAbbr)} alt={game.topAbbr} className="w-8 h-8 object-contain drop-shadow-md" onError={(e) => (e.currentTarget.style.display = 'none')} />
              {game.topAbbr}
            </td>
            <td className="font-black text-xl" style={{ color: 'var(--text-contrast-left)' }}>{getSquaresDigit('top', 'Q1')}</td>
            <td className="font-black text-xl" style={{ color: 'var(--text-contrast-left)' }}>{getSquaresDigit('top', 'Q2')}</td>
            <td className="font-black text-xl" style={{ color: 'var(--text-contrast-left)' }}>{getSquaresDigit('top', 'Q3')}</td>
            <td className={`font-black text-xl transition-transform ${isFinal ? 'scale-110 drop-shadow-sm' : ''}`}
                style={{ color: 'var(--text-contrast-top)' }}>
              {live?.isManual ? (live.topScore % 10) : getSquaresDigit('top', 'Final')}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

type RowStatus = 'awaiting' | 'blank' | 'current' | 'winner';

const getRowStatus = (isFinal: boolean, qNum: number, state: 'pre' | 'in' | 'post', period: number): RowStatus => {
  if (state === 'pre') return 'awaiting';
  if (state === 'post') return 'winner';
  if (isFinal) return period >= 4 ? 'current' : 'blank';
  if (period < qNum) return 'blank';
  if (period === qNum) return 'current';
  return 'winner';
};

const getPlayersAtScore = (board: BoardData, key: string) => {
  if (!key) return [];
  const [topDigit, leftDigit] = key.split('-').map(Number);
  const colIdx = board.oppAxis.indexOf(topDigit);
  const rowIdx = board.bearsAxis.indexOf(leftDigit);
  if (colIdx === -1 || rowIdx === -1) return [];
  return board.squares[rowIdx * 10 + colIdx] || [];
};

const Payouts: React.FC<{ 
  liveStatus: string; 
  lastUpdated: string; 
  highlights: WinnerHighlights; 
  board: BoardData; 
  live: LiveGameData | null 
}> = ({ liveStatus, lastUpdated, highlights, board, live }) => {

  const renderWinnerLine = (label: string, amount: string, status: RowStatus, qKey: string, isFinal: boolean = false) => {
    if (status === 'blank') return null;
    let winnerData: { names: string[], statusText: string, key: string } | null = null;

    if (status === 'winner' && !live?.isManual) {
      const lockedKey = highlights.quarterWinners[qKey];
      if (lockedKey) {
        winnerData = { names: getPlayersAtScore(board, lockedKey), statusText: 'Winner', key: lockedKey };
      }
    } else if (status === 'current' || live?.isManual) {
      if (live) {
        const currentKey = `${live.topScore % 10}-${live.leftScore % 10}`;
        winnerData = { names: getPlayersAtScore(board, currentKey), statusText: live.isManual ? 'Current Score' : 'Current Leader', key: currentKey };
      }
    }

    return (
      <div className={`group flex flex-col gap-0.5 ${isFinal ? 'mt-4 pt-3 border-t border-white/10' : 'pb-2 border-b border-white/5 last:border-0'}`}>
        <div className="flex justify-between items-center text-sm">
          <span className={`font-black uppercase tracking-tight ${isFinal ? 'text-team-top text-base' : 'text-gray-400'}`}>{label}</span>
          <span className={`font-black ${isFinal ? 'text-team-top text-base' : 'text-white'}`}>{amount}</span>
        </div>
        {status === 'awaiting' ? (
          <div className="text-[10px] text-gray-600 font-bold uppercase italic tracking-widest">Awaiting Kickoff...</div>
        ) : winnerData ? (
          <div className="flex items-center justify-between animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] md:text-xs font-bold ${winnerData.statusText === 'Winner' ? 'text-white' : 'text-team-top italic'}`}>
                {winnerData.names.length > 0 ? winnerData.names.join(', ') : 'No Owner'}
              </span>
              <span className="text-[9px] text-gray-500 font-mono">[{winnerData.key}]</span>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${winnerData.statusText === 'Winner' ? 'text-green-400' : 'text-team-top animate-pulse'}`}>
              {winnerData.statusText}
            </span>
          </div>
        ) : <div className="h-4"></div>}
      </div>
    );
  };

  const currentStatus = live ? live.state : 'pre';
  const currentPeriod = live ? live.period : 0;

  return (
    <div className="liquid-glass p-4 h-auto flex flex-col">
      <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Payout Structure</div>
      <div className="flex flex-col justify-start gap-2">
        {renderWinnerLine('1st Quarter Winner', '$125', getRowStatus(false, 1, currentStatus, currentPeriod), 'Q1')}
        {renderWinnerLine('2nd Quarter Winner', '$125', getRowStatus(false, 2, currentStatus, currentPeriod), 'Q2')}
        {renderWinnerLine('3rd Quarter Winner', '$125', getRowStatus(false, 3, currentStatus, currentPeriod), 'Q3')}
        {renderWinnerLine('Final Game Winner', '$250', getRowStatus(true, 4, currentStatus, currentPeriod), 'Final', true)}
      </div>
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${liveStatus.includes('Error') || liveStatus.includes('Required') ? 'bg-red-500' : 'bg-white live-indicator'}`}></div>
          <span className="text-gray-500 font-bold uppercase tracking-widest">{liveStatus}</span>
        </div>
        <span className="text-gray-600 italic">Synced {lastUpdated || 'Never'}</span>
      </div>
    </div>
  );
};

export default { Scoreboard, Payouts };
