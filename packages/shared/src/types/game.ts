export type BandRole = 'guitarist' | 'keyboardist' | 'singer' | 'drummer' | 'producer';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type Judgement = 'perfect' | 'great' | 'good' | 'miss';

export type LeagueDivision = 'garage' | 'club' | 'arena' | 'festival' | 'headliner';

export type GameMode = 'quickplay' | 'tour' | 'online_coop' | 'battle' | 'practice';

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
  isUnison?: boolean;
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
  unisonHitsCount: number;
}

export interface BandMemberStatus {
  id: string;
  name: string;
  role: BandRole;
  isAi: boolean;
  accuracy: number;
  combo: number;
  hypeContribution: number;
  lastJudgement?: Judgement;
  isLockedInGroove: boolean;
}

export interface BandScoreState {
  totalScore: number;
  crowdHype: number; // 0 to 100
  ensembleBonus: number;
  unisonHits: number;
  isBooedOff: boolean;
  members: BandMemberStatus[];
}

export interface RoleInfo {
  id: BandRole;
  name: string;
  icon: string;
  color: string;
  description: string;
  specialAbilityName: string;
  specialAbilityDesc: string;
  controlsHint: {
    mobile: string;
    laptop: string;
  };
}

export interface VenueInfo {
  id: string;
  name: string;
  city: string;
  requiredFans: number;
  crowdSize: string;
  stageGlowColor: string;
  description: string;
}

export interface BandProfile {
  id: string;
  name: string;
  division: LeagueDivision;
  rating: number; // ELO rating, e.g. 1200
  fans: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  wins: number;
  losses: number;
  completedVenues: string[];
  equippedCosmetics: {
    guitarSkin?: string;
    drumKitSkin?: string;
    keysSkin?: string;
    micSkin?: string;
    stageBanner?: string;
  };
}

export interface LeagueLeaderboardEntry {
  rank: number;
  bandName: string;
  division: LeagueDivision;
  rating: number;
  fans: number;
  winRate: number;
  streak: number;
}

// Multiplayer WebSockets Network protocol message types
export interface ClockSyncPingMessage {
  clientSendTime: number;
}

export interface ClockSyncPongMessage {
  clientSendTime: number;
  serverReceiveTime: number;
  serverSendTime: number;
}

export interface RoomStateUpdateMessage {
  roomId: string;
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  songId: string;
  songStartServerTime: number;
  bandScore: number;
  crowdHype: number;
  members: BandMemberStatus[];
  battleScores?: {
    bandAScore: number;
    bandBScore: number;
    momentum: number; // -100 to +100
  };
}

export interface PlayerHitRelayMessage {
  playerId: string;
  role: BandRole;
  noteId: string | number;
  judgement: Judgement;
  deltaMs: number;
  isUnison: boolean;
}
