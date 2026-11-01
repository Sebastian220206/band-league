import {
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

  if (hit.judgement === 'miss') {
    combo = 0;
  } else {
    combo += 1;
    if (combo > maxCombo) {
      maxCombo = combo;
    }
  }

  const basePoints = JUDGEMENT_POINTS[hit.judgement] || 0;
  const multiplier = getComboMultiplier(combo);
  const unisonMultiplier = hit.isUnison ? 1.5 : 1.0;
  const pointsEarned = Math.round(basePoints * multiplier * unisonMultiplier);

  const score = state.score + pointsEarned;

  // Accuracy calculation based on max potential points
  // perfect = 1.0, great = 0.7, good = 0.4, miss = 0.0
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

  // Formula from implementation plan:
  // w_p = 0.4, w_t = 0.3, w_e = 0.3
  const weighted =
    0.4 * averagePerformanceAccuracy +
    0.3 * averageTimingScore +
    0.3 * ensembleScore;

  return Math.round(weighted * 1000 * bandMultiplier);
}
