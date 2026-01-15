
import React from 'react';
import { GameState, BoardData, LiveGameData } from '../types';

interface ScenarioProps {
  game: GameState;
  board: BoardData;
  live: LiveGameData | null;
  onScenarioHover: (coords: { left: number, top: number } | null) => void;
}

const ScenarioCard: React.FC<{ 
  label: string; 
  top: number; 
  left: number; 
  names: string[]; 
  payout: string;
  onHover: (coords: { left: number, top: number } | null) => void;
}> = ({ label, top, left, names, payout, onHover }) => (
  <div 
    className="bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-[#9D2235]/30 transition-all cursor-pointer group hover:border-gold-glass hover:shadow-[0_0_15px_rgba(157,34,53,0.3)] backdrop-blur-sm"
    onMouseEnter={() => onHover({ left, top })}
    onMouseLeave={() => onHover(null)}
    onTouchStart={() => onHover({ left, top })}
  >
    <div className="flex justify-between items-center mb-1">
      <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider group-hover:text-white transition-colors">{label}</div>
      <div className="text-xs font-black text-gold group-hover:scale-110 transition-transform">{top}-{left}</div>
    </div>
    <div className="flex justify-between items-center">
      <div className="text-[11px] text-white/80 font-medium truncate max-w-[70%]">
        {names.length > 0 ? names.join(', ') : '—'}
      </div>
      <div className="text-[9px] font-bold text-green-400 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
        Wins {payout}
      </div>
    </div>
  </div>
);

const getIndexedPlayers = (board: BoardData, topDigit: number, leftDigit: number) => {
  const colIdx = board.oppAxis.indexOf(topDigit);
  const rowIdx = board.bearsAxis.indexOf(leftDigit);
  if (colIdx === -1 || rowIdx === -1) return [];
  return board.squares[rowIdx * 10 + colIdx] || [];
};

const LeftScenarios: React.FC<ScenarioProps> = ({ game, board, live, onScenarioHover }) => {
  const currentLeft = live?.leftScore || 0;
  const currentTop = live?.topScore || 0;
  const payout = (live?.period || 1) >= 4 ? '$250' : '$125';

  const scenarios = [
    { label: 'Safety (+2)', addLeft: 2 },
    { label: 'Field Goal (+3)', addLeft: 3 },
    { label: 'TD Miss XP (+6)', addLeft: 6 },
    { label: 'TD + Kick (+7)', addLeft: 7 },
    { label: 'TD + 2pt (+8)', addLeft: 8 },
  ];

  return (
    <div className="liquid-glass p-4">
      <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 pl-1 flex items-center justify-between">
        <span>If {game.leftAbbr} Scores Next...</span>
        <span className="text-[9px] text-gold opacity-50">HOVER TO VIEW</span>
      </h5>
      <div className="flex flex-col gap-2">
        {scenarios.map((s, i) => {
          const lDigit = (currentLeft + s.addLeft) % 10;
          const tDigit = currentTop % 10;
          const names = getIndexedPlayers(board, tDigit, lDigit);
          return (
            <ScenarioCard 
              key={i} 
              label={s.label} 
              top={tDigit} 
              left={lDigit} 
              names={names} 
              payout={payout}
              onHover={onScenarioHover}
            />
          );
        })}
      </div>
    </div>
  );
};

const TopScenarios: React.FC<ScenarioProps> = ({ game, board, live, onScenarioHover }) => {
  const currentLeft = live?.leftScore || 0;
  const currentTop = live?.topScore || 0;
  const payout = (live?.period || 1) >= 4 ? '$250' : '$125';

  const scenarios = [
    { label: 'Safety (+2)', addTop: 2 },
    { label: 'Field Goal (+3)', addTop: 3 },
    { label: 'TD Miss XP (+6)', addTop: 6 },
    { label: 'TD + Kick (+7)', addTop: 7 },
    { label: 'TD + 2pt (+8)', addTop: 8 },
  ];

  return (
    <div className="liquid-glass p-4">
      <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 pl-1 flex items-center justify-between">
        <span>If {game.topAbbr} Scores Next...</span>
        <span className="text-[9px] text-gold opacity-50">HOVER TO VIEW</span>
      </h5>
      <div className="flex flex-col gap-2">
        {scenarios.map((s, i) => {
          const lDigit = currentLeft % 10;
          const tDigit = (currentTop + s.addTop) % 10;
          const names = getIndexedPlayers(board, tDigit, lDigit);
          return (
            <ScenarioCard 
              key={i} 
              label={s.label} 
              top={tDigit} 
              left={lDigit} 
              names={names} 
              payout={payout}
              onHover={onScenarioHover}
            />
          );
        })}
      </div>
    </div>
  );
};

export default { LeftScenarios, TopScenarios };
