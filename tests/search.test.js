import assert from 'node:assert/strict';
import test from 'node:test';

import { search } from '../js/core/search.js';

test('search keeps vocabulary and country results', () => {
  assert.deepEqual(
    search('Brasil').slice(0, 2).map(item => item.id),
    ['pais-br', 'char-ba'],
  );
});

test('search finds structured translation and examples', () => {
  assert.equal(search('eu').some(item => item.id === 'wo'), true);
  assert.equal(search('Sou brasileiro').some(item => item.id === 'wo'), true);
});
