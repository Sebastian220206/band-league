import {
  BandRole,
  BandMemberStatus,
  HitResult,
  Judgement,
  JudgementWindowConfig,
  PlayerScoreState,
} from '../types/game.js';
import {
  DEFAULT_JUDGEMENT_WINDOWS,
  JUDGEMENT_POINTS,
  HYPE_IMPACT,
} from './constants.js';

export function evaluateHit(
  targetTimeMs: number,
  actualTimeMs: number,
  windows: JudgementWindowConfig = DEFAULT_JUDGEMENT_WINDOWS
): { judgement: Judgement; deltaMs: number } {
  const deltaMs = actualTimeMs - targetTimeMs;
  const absDelta = Math.abs(deltaMs);

  if (absDelta <= windows.perfect) {
    return { judgement: 'perfect', deltaMs };
  } else if (absDelta <= windows.great) {
    return { judgement: 'great', deltaMs };
  } else if (absDelta <= windows.good) {
    return { judgement: 'good', deltaMs };
  } else {
    return { judgement: 'miss', deltaMs };
  }
}

export function getComboMultiplier(combo: number): number {
  if (combo >= 40) return 4.0;
  if (combo >= 25) return 3.0;
  if (combo >= 10) return 2.0;
  return 1.0;
}

export function createInitialScoreState(): PlayerScoreState {
  return {
    score: 0,
    combo: 0,
    maxCombo: 0,
    counts: {
      perfect: 0,
      great: 0,
      good: 0,
      miss: 0,
    },
    totalNotesJudged: 0,
    accuracy: 100.0,
    timingOffsetTotalMs: 0,
    averageOffsetMs: 0,
    unisonHitsCount: 0,
  };
}

export function applyHitToScoreState(
  state: PlayerScoreState,
  hit: { judgement: Judgement; deltaMs: number; isUnison?: boolean }
): { newState: PlayerScoreState; pointsEarned: number } {
  const counts = { ...state.counts, [hit.judgement]: state.counts[hit.judgement] + 1 };
  const totalNotesJudged = state.totalNotesJudged + 1;

  let combo = state.combo;
  let maxCombo = state.maxCombo;
  let unisonHitsCount = state.unisonHitsCount;

  if (hit.judgement === 'miss') {
    combo = 0;
  } else {
    combo += 1;
    if (combo > maxCombo) {
      maxCombo = combo;
    }
    if (hit.isUnison) {
      unisonHitsCount += 1;
    }
  }

  const basePoints = JUDGEMENT_POINTS[hit.judgement] || 0;
  const multiplier = getComboMultiplier(combo);
  const unisonMultiplier = hit.isUnison ? 1.5 : 1.0;
  const pointsEarned = Math.round(basePoints * multiplier * unisonMultiplier);

  const score = state.score + pointsEarned;

  const totalWeight =
    counts.perfect * 1.0 +
    counts.great * 0.7 +
    counts.good * 0.4;
  const accuracy = totalNotesJudged > 0 ? (totalWeight / totalNotesJudged) * 100 : 100;

  const timingOffsetTotalMs =
    hit.judgement !== 'miss'
      ? state.timingOffsetTotalMs + hit.deltaMs
      : state.timingOffsetTotalMs;
  const hitCountNonMiss = counts.perfect + counts.great + counts.good;
  const averageOffsetMs =
    hitCountNonMiss > 0 ? timingOffsetTotalMs / hitCountNonMiss : 0;

  const newState: PlayerScoreState = {
    score,
    combo,
    maxCombo,
    counts,
    totalNotesJudged,
    accuracy: Math.round(accuracy * 10) / 10,
    timingOffsetTotalMs,
    averageOffsetMs: Math.round(averageOffsetMs * 10) / 10,
    unisonHitsCount,
  };

  return { newState, pointsEarned };
}

export function updateCrowdHype(
  currentHype: number,
  judgement: Judgement
): number {
  const change = HYPE_IMPACT[judgement] ?? 0;
  const next = currentHype + change;
  return Math.min(HYPE_IMPACT.maxHype, Math.max(HYPE_IMPACT.minHype, next));
}

export function calculateFinalBandScore(params: {
  averagePerformanceAccuracy: number; // 0 - 100
  averageTimingScore: number;         // 0 - 100
  ensembleScore: number;              // 0 - 100
  bandMultiplier?: number;
}): number {
  const {
    averagePerformanceAccuracy,
    averageTimingScore,
    ensembleScore,
    bandMultiplier = 1.0,
  } = params;

  // w_p = 0.4, w_t = 0.3, w_e = 0.3
  const weighted =
    0.4 * averagePerformanceAccuracy +
    0.3 * averageTimingScore +
    0.3 * ensembleScore;

  return Math.round(weighted * 1000 * bandMultiplier);
}

/**
 * Simulates an AI bandmate playing a note according to band skill level
 */
export function simulateAiNoteHit(skillLevel: 'easy' | 'medium' | 'hard' | 'expert'): {
  judgement: Judgement;
  deltaMs: number;
} {
  const rand = Math.random();
  if (skillLevel === 'easy') {
    // 60% perfect, 25% great, 10% good, 5% miss
    if (rand < 0.60) return { judgement: 'perfect', deltaMs: (Math.random() - 0.5) * 50 };
    if (rand < 0.85) return { judgement: 'great', deltaMs: (Math.random() - 0.5) * 100 };
    if (rand < 0.95) return { judgement: 'good', deltaMs: (Math.random() - 0.5) * 150 };
    return { judgement: 'miss', deltaMs: 180 };
  } else if (skillLevel === 'medium') {
    // 78% perfect, 16% great, 4% good, 2% miss
    if (rand < 0.78) return { judgement: 'perfect', deltaMs: (Math.random() - 0.5) * 40 };
    if (rand < 0.94) return { judgement: 'great', deltaMs: (Math.random() - 0.5) * 80 };
    if (rand < 0.98) return { judgement: 'good', deltaMs: (Math.random() - 0.5) * 120 };
    return { judgement: 'miss', deltaMs: 160 };
  } else {
    // 90% perfect, 8% great, 1.5% good, 0.5% miss
    if (rand < 0.90) return { judgement: 'perfect', deltaMs: (Math.random() - 0.5) * 30 };
    if (rand < 0.98) return { judgement: 'great', deltaMs: (Math.random() - 0.5) * 60 };
    return { judgement: 'good', deltaMs: (Math.random() - 0.5) * 90 };
  }
}

/**
 * Calculates new ELO ratings after a Battle of the Bands match
 */
export function calculateEloDelta(ratingA: number, ratingB: number, scoreA: number, scoreB: number, kFactor: number = 32): {
  deltaA: number;
  deltaB: number;
} {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  let actualA = 0.5;
  if (scoreA > scoreB) actualA = 1.0;
  else if (scoreA < scoreB) actualA = 0.0;
  const actualB = 1.0 - actualA;

  const deltaA = Math.round(kFactor * (actualA - expectedA));
  const deltaB = Math.round(kFactor * (actualB - expectedB));

  return { deltaA, deltaB };
}
