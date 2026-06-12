import assert from 'node:assert/strict';
import test from 'node:test';

import { passwordStrength, MIN_PASSWORD_LENGTH } from '../js/core/password.js';

test('senha curta é inválida e fraca', () => {
  const r = passwordStrength('abc');
  assert.equal(r.valid, false);
  assert.equal(r.score, 0);
});

test('senha no tamanho mínimo é válida', () => {
  const r = passwordStrength('a'.repeat(MIN_PASSWORD_LENGTH));
  assert.equal(r.valid, true);
  assert.ok(r.score >= 1);
});

test('senha complexa atinge score máximo', () => {
  const r = passwordStrength('Abcdef1!longa');
  assert.equal(r.score, 4);
  assert.equal(r.label, 'Forte');
});

test('lida com entrada vazia/nula', () => {
  assert.equal(passwordStrength('').score, 0);
  assert.equal(passwordStrength(null).valid, false);
});
