export type BandRole = 'guitarist' | 'keyboardist' | 'singer' | 'drummer' | 'producer';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type Judgement = 'perfect' | 'great' | 'good' | 'miss';

export interface JudgementWindowConfig {
  perfect: number; // e.g. ±35ms
  great: number;   // e.g. ±70ms
  good: number;    // e.g. ±110ms
  missLimit: number; // beyond this is ignored or counted as early/late miss
}

export interface HitResult {
  noteId: string | number;
  judgement: Judgement;
  deltaMs: number; // positive = late, negative = early
  rawPoints: number;
  combo: number;
}

export interface PlayerScoreState {
  score: number;
  combo: number;
  maxCombo: number;
  counts: Record<Judgement, number>;
  totalNotesJudged: number;
  accuracy: number; // 0 - 100 percentage
  timingOffsetTotalMs: number;
  averageOffsetMs: number;
}

export interface BandScoreState {
  totalScore: number;
  crowdHype: number; // 0 to 100
  ensembleBonus: number;
  unisonHits: number;
  isBooedOff: boolean;
}

export interface RoleInfo {
  id: BandRole;
  name: string;
  icon: string;
  color: string;
  description: string;
  controlsHint: {
    mobile: string;
    laptop: string;
  };
}
