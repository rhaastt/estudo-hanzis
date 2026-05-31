import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildQuestions,
  buildStrokeQuestions,
  eligiblePool,
  poolSize,
} from '../js/core/quiz-engine.js';

test('regular quiz modes keep countries eligible', () => {
  assert.equal(poolSize('hanzi-to-trans', ['pais']), 100);
  assert.equal(buildQuestions('hanzi-to-trans', ['pais'], 5).length, 5);
});

test('stroke-order mode excludes countries', () => {
  assert.equal(poolSize('stroke-order', ['pais']), 0);
  assert.deepEqual(buildStrokeQuestions(['pais'], 'all'), []);
});

test('stroke-order mode only includes single-character items', () => {
  const pool = eligiblePool('stroke-order', []);

  assert.ok(pool.length > 0);
  assert.ok(pool.every(item => [...item.hanzi].length === 1));
  assert.deepEqual(
    buildStrokeQuestions([], 'all').map(item => item.id).sort(),
    pool.map(item => item.id).sort(),
  );
});
