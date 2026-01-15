
export interface Team {
  abbr: string;
  name: string;
}

export interface GameState {
  title: string;
  meta: string;
  leftAbbr: string;
  leftName: string;
  topAbbr: string;
  topName: string;
  dates: string;
  lockTitle: boolean;
  lockMeta: boolean;
  // Manual Score Overrides
  useManualScores?: boolean;
  manualLeftScore?: number;
  manualTopScore?: number;
  coverImage?: string; // Base64 image string for board cover
}

export interface BoardData {
  bearsAxis: number[];
  oppAxis: number[];
  squares: string[][]; // Flat array of 100 entries (index 0-99)
}

export interface QuarterScores {
  left: number;
  top: number;
}

export interface LiveGameData {
  leftScore: number;
  topScore: number;
  quarterScores: {
    Q1: QuarterScores;
    Q2: QuarterScores;
    Q3: QuarterScores;
    Q4: QuarterScores;
    OT: QuarterScores;
  };
  clock: string;
  period: number;
  state: 'pre' | 'in' | 'post';
  detail: string;
  isOvertime: boolean;
  isManual?: boolean;
}

export interface WinnerHighlights {
  quarterWinners: Record<string, string>;
  currentLabel: string;
}
