
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
    <div className="premium-glass p-6 md:p-8 rounded-3xl flex flex-col justify-between shadow-2xl relative overflow-hidden group">
      {/* Subtle Team Glows (Background) */}
      <div className="absolute top-[-50%] left-[-20%] w-[60%] h-[100%] bg-team-left blur-[120px] opacity-[0.07] group-hover:opacity-[0.1] transition-opacity duration-700 pointer-events-none"></div>
      <div className="absolute bottom-[-50%] right-[-20%] w-[60%] h-[100%] bg-team-top blur-[120px] opacity-[0.07] group-hover:opacity-[0.1] transition-opacity duration-700 pointer-events-none"></div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex-1">
          <h4 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3 drop-shadow-sm text-white">
            {game.title || `${game.leftAbbr} vs ${game.topAbbr}`}
            {live?.isManual && (
              <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">MANUAL</span>
            )}
          </h4>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">{game.meta}</p>
        </div>
        <div className="flex items-center gap-3">
          {live && (
            <div className={`font-bold text-[10px] uppercase px-3 py-1.5 rounded-full tracking-widest shadow-sm border ${live.state === 'in' ? 'bg-green-500/10 border-green-500/20 text-green-400 animate-pulse' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              {live.state === 'post' ? 'Final' : (live.isOvertime ? `OT ${live.clock}` : (live.detail || live.clock))}
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin opacity-50' : ''}`}
            title="Refresh Live Scores"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {!game.dates && !live?.isManual && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-md relative z-10">
          <p className="text-xs font-bold text-white uppercase tracking-widest">
            Game Date Not Set
          </p>
          <p className="text-[10px] text-gray-400 font-medium mt-1">
            Organizer must set a date to enable live scores.
          </p>
        </div>
      )}

      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-center text-gray-500 relative z-10">
        Squares Scoreboard (Last Digit)
      </div>

      <table className="w-full text-center border-separate border-spacing-x-0 relative z-10">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <th className="text-left py-3 pl-4">Team</th>
            <th className="w-14">Q1</th>
            <th className="w-14">Q2</th>
            <th className="w-14">Q3</th>
            <th className="w-20 text-white">{finalHeader}</th>
          </tr>
        </thead>
        <tbody className="text-base font-medium">
          {/* Left Team Row */}
          <tr className="group/row transition-colors hover:bg-white/5">
            <td className="py-4 pl-4 text-left font-black uppercase tracking-tighter text-xl flex items-center gap-4 text-white rounded-l-2xl">
              <img src={getLogoUrl(game.leftAbbr)} alt={game.leftAbbr} className="w-10 h-10 object-contain drop-shadow-lg" onError={(e) => (e.currentTarget.style.display = 'none')} />
              <span className="relative">
                {game.leftAbbr}
                <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-team-left opacity-50 rounded-full"></div>
              </span>
            </td>
            <td className="font-bold text-xl text-white/90 border-b border-white/5 group-hover/row:border-transparent">{getSquaresDigit('left', 'Q1')}</td>
            <td className="font-bold text-xl text-white/90 border-b border-white/5 group-hover/row:border-transparent">{getSquaresDigit('left', 'Q2')}</td>
            <td className="font-bold text-xl text-white/90 border-b border-white/5 group-hover/row:border-transparent">{getSquaresDigit('left', 'Q3')}</td>
            <td className={`font-black text-2xl text-white rounded-r-2xl transition-transform ${isFinal ? 'scale-110 drop-shadow-glow' : ''}`}>
              {live?.isManual ? (live.leftScore % 10) : getSquaresDigit('left', 'Final')}
            </td>
          </tr>

          {/* Top Team Row */}
          <tr className="group/row transition-colors hover:bg-white/5">
            <td className="py-4 pl-4 text-left font-black uppercase tracking-tighter text-xl flex items-center gap-4 text-white rounded-l-2xl">
              <img src={getLogoUrl(game.topAbbr)} alt={game.topAbbr} className="w-10 h-10 object-contain drop-shadow-lg" onError={(e) => (e.currentTarget.style.display = 'none')} />
              <span className="relative">
                {game.topAbbr}
                <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-team-top opacity-50 rounded-full"></div>
              </span>
            </td>
            <td className="font-bold text-xl text-white/90 border-t border-white/5 group-hover/row:border-transparent">{getSquaresDigit('top', 'Q1')}</td>
            <td className="font-bold text-xl text-white/90 border-t border-white/5 group-hover/row:border-transparent">{getSquaresDigit('top', 'Q2')}</td>
            <td className="font-bold text-xl text-white/90 border-t border-white/5 group-hover/row:border-transparent">{getSquaresDigit('top', 'Q3')}</td>
            <td className={`font-black text-2xl text-white rounded-r-2xl transition-transform ${isFinal ? 'scale-110 drop-shadow-glow' : ''}`}>
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
  live: LiveGameData | null;
  game: GameState;
}> = ({ liveStatus, lastUpdated, highlights, board, live, game }) => {

  const renderWinnerLine = (label: string, amount: string, status: RowStatus, qKey: string, isFinal: boolean = false) => {
    if (status === 'blank') return null;
    let winnerData: { names: string[], statusText: string, key: string } | null = null;
    let isActive = false;

    if (status === 'winner' && !live?.isManual) {
      const lockedKey = highlights.quarterWinners[qKey];
      if (lockedKey) {
        winnerData = { names: getPlayersAtScore(board, lockedKey), statusText: 'Winner', key: lockedKey };
      }
    } else if (status === 'current' || live?.isManual) {
      if (live) {
        isActive = true;
        const currentKey = `${live.topScore % 10}-${live.leftScore % 10}`;
        winnerData = { names: getPlayersAtScore(board, currentKey), statusText: live.isManual ? 'Current Score' : 'Current Holder', key: currentKey };
      }
    }

    return (
      <div className={`group flex flex-col gap-1 transition-all duration-300 ${isFinal ? 'mt-4 pt-4 border-t border-white/10' : 'pb-4 border-b border-white/5 last:border-0'}`}>
        <div className="flex justify-between items-center text-sm">
          <span className={`font-bold uppercase tracking-wide text-gray-400 group-hover:text-white transition-colors`}>{label}</span>
          <span className={`font-black tracking-tight ${isFinal ? 'text-[#FFC72C] text-lg' : 'text-white'}`}>{amount}</span>
        </div>

        {/* Status Area */}
        {status === 'awaiting' ? (
          <div className="flex items-center gap-2 mt-1 opacity-50">
            <div className="w-1 h-1 rounded-full bg-gray-500"></div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Awaiting Kickoff</span>
          </div>
        ) : winnerData ? (
          <div className={`flex flex-col mt-2 p-3 rounded-2xl border backdrop-blur-md transition-all duration-500 ${isActive
            ? 'bg-gradient-to-r from-[#9D2235]/20 to-transparent border-[#9D2235]/30 shadow-sm'
            : 'bg-white/5 border-white/5'
            }`}>

            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                {isActive && <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>}
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-red-400' : 'text-[#FFC72C]'}`}>
                  {winnerData.statusText}
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-500 bg-black/20 px-2 py-0.5 rounded-lg border border-white/5">{winnerData.key}</span>
            </div>

            <div className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
              {winnerData.names.length > 0 ? winnerData.names.join(', ') : 'No Owner'}
            </div>
          </div>
        ) : <div className="h-1"></div>}
      </div>
    );
  };

  const currentStatus = live ? live.state : 'pre';
  const currentPeriod = live ? live.period : 0;
  const p = game.payouts || { Q1: 125, Q2: 125, Q3: 125, Final: 250 };

  return (
    <div className="premium-glass p-6 md:p-8 rounded-3xl h-auto flex flex-col shadow-2xl">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 px-1">Prize Structure</div>
      <div className="flex flex-col justify-start gap-1">
        {renderWinnerLine('1st Quarter', `$${p.Q1}`, getRowStatus(false, 1, currentStatus, currentPeriod), 'Q1')}
        {renderWinnerLine('2nd Quarter', `$${p.Q2}`, getRowStatus(false, 2, currentStatus, currentPeriod), 'Q2')}
        {renderWinnerLine('3rd Quarter', `$${p.Q3}`, getRowStatus(false, 3, currentStatus, currentPeriod), 'Q3')}
        {renderWinnerLine('Final Score', `$${p.Final}`, getRowStatus(true, 4, currentStatus, currentPeriod), 'Final', true)}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${liveStatus.includes('Error') || liveStatus.includes('Required') ? 'bg-red-500' : 'bg-green-500 live-indicator'}`}></div>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{liveStatus}</span>
        </div>
        <span className="text-[9px] text-gray-600 font-medium italic">Synced {lastUpdated || 'Never'}</span>
      </div>
    </div>
  );
};

export default { Scoreboard, Payouts };
