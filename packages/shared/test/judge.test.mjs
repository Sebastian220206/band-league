import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateHit,
  applyHitToScoreState,
  createInitialScoreState,
  getComboMultiplier,
  updateCrowdHype,
  calculateFinalBandScore,
  calculateEloDelta,
  simulateAiNoteHit,
  DEFAULT_JUDGEMENT_WINDOWS,
} from '../dist/index.js';

test('Timing Judge: detects Perfect, Great, Good, and Miss within target windows', () => {
  const target = 1000;
  assert.equal(evaluateHit(target, 1000).judgement, 'perfect');
  assert.equal(evaluateHit(target, 1030).judgement, 'perfect');
  assert.equal(evaluateHit(target, 970).judgement, 'perfect');
  assert.equal(evaluateHit(target, 1050).judgement, 'great');
  assert.equal(evaluateHit(target, 950).judgement, 'great');
  assert.equal(evaluateHit(target, 1100).judgement, 'good');
  assert.equal(evaluateHit(target, 900).judgement, 'good');
  assert.equal(evaluateHit(target, 1120).judgement, 'miss');
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

  const hit1 = applyHitToScoreState(state, { judgement: 'perfect', deltaMs: 5, isUnison: true });
  state = hit1.newState;
  assert.equal(state.combo, 1);
  assert.equal(state.unisonHitsCount, 1);
  assert.equal(state.score, 150); // 100 * 1.5 unison

  const hit2 = applyHitToScoreState(state, { judgement: 'great', deltaMs: -40 });
  state = hit2.newState;
  assert.equal(state.combo, 2);
  assert.equal(state.counts.great, 1);

  const hit3 = applyHitToScoreState(state, { judgement: 'miss', deltaMs: 150 });
  state = hit3.newState;
  assert.equal(state.combo, 0);
  assert.equal(state.maxCombo, 2);
});

test('ELO rating updates correctly for Battle of the Bands', () => {
  // Band A (1200) beats Band B (1200)
  const { deltaA, deltaB } = calculateEloDelta(1200, 1200, 95000, 85000, 32);
  assert.ok(deltaA > 0, 'Winner gains ELO');
  assert.ok(deltaB < 0, 'Loser drops ELO');
  assert.equal(deltaA + deltaB, 0, 'Zero-sum rating exchange');
  assert.equal(deltaA, 16);
});

test('AI note simulator produces valid judgements', () => {
  for (let i = 0; i < 20; i++) {
    const aiHit = simulateAiNoteHit('medium');
    assert.ok(['perfect', 'great', 'good', 'miss'].includes(aiHit.judgement));
  }
});
