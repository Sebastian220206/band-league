import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateHit,
  applyHitToScoreState,
  createInitialScoreState,
  getComboMultiplier,
  updateCrowdHype,
  calculateFinalBandScore,
  DEFAULT_JUDGEMENT_WINDOWS,
} from '../dist/index.js';

test('Timing Judge: detects Perfect, Great, Good, and Miss within target windows', () => {
  const target = 1000;

  // Perfect: ±35ms
  assert.equal(evaluateHit(target, 1000).judgement, 'perfect');
  assert.equal(evaluateHit(target, 1030).judgement, 'perfect');
  assert.equal(evaluateHit(target, 970).judgement, 'perfect');

  // Great: ±70ms
  assert.equal(evaluateHit(target, 1050).judgement, 'great');
  assert.equal(evaluateHit(target, 950).judgement, 'great');

  // Good: ±110ms
  assert.equal(evaluateHit(target, 1100).judgement, 'good');
  assert.equal(evaluateHit(target, 900).judgement, 'good');

  // Miss: >110ms
  assert.equal(evaluateHit(target, 1120).judgement, 'miss');
  assert.equal(evaluateHit(target, 850).judgement, 'miss');
});

test('Combo Multiplier scales with streak', () => {
  assert.equal(getComboMultiplier(0), 1.0);
  assert.equal(getComboMultiplier(9), 1.0);
  assert.equal(getComboMultiplier(10), 2.0);
  assert.equal(getComboMultiplier(24), 2.0);
  assert.equal(getComboMultiplier(25), 3.0);
  assert.equal(getComboMultiplier(40), 4.0);
});

test('Score State accumulates combo, accuracy, and offsets', () => {
  let state = createInitialScoreState();

  const hit1 = applyHitToScoreState(state, { judgement: 'perfect', deltaMs: 5 });
  state = hit1.newState;
  assert.equal(state.combo, 1);
  assert.equal(state.score, 100);
  assert.equal(state.accuracy, 100);

  const hit2 = applyHitToScoreState(state, { judgement: 'great', deltaMs: -40 });
  state = hit2.newState;
  assert.equal(state.combo, 2);
  assert.equal(state.counts.great, 1);

  // Miss resets combo
  const hit3 = applyHitToScoreState(state, { judgement: 'miss', deltaMs: 150 });
  state = hit3.newState;
  assert.equal(state.combo, 0);
  assert.equal(state.maxCombo, 2);
});

test('Crowd Hype responds to judgements and clamps properly', () => {
  let hype = 50.0;
  hype = updateCrowdHype(hype, 'perfect');
  assert.ok(hype > 50);

  let lowHype = 2.0;
  lowHype = updateCrowdHype(lowHype, 'miss');
  assert.equal(lowHype, 0.0); // clamped at 0
});

test('Final Band Score applies weighted formula correctly', () => {
  const score = calculateFinalBandScore({
    averagePerformanceAccuracy: 90,
    averageTimingScore: 80,
    ensembleScore: 85,
  });

  // 0.4*90 + 0.3*80 + 0.3*85 = 36 + 24 + 25.5 = 85.5
  // 85.5 * 1000 = 85500
  assert.equal(score, 85500);
});
