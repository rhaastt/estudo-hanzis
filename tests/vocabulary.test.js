import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatMnemonic,
  inferTonesFromPinyin,
} from '../js/core/vocabulary.js';

test('inferTonesFromPinyin extracts tone marks in order', () => {
  assert.deepEqual(inferTonesFromPinyin('Zhōngguó'), [1, 2]);
  assert.deepEqual(inferTonesFromPinyin('Shātè Ālābó'), [1, 4, 1, 1, 2]);
});

test('formatMnemonic escapes HTML and allows emphasis only', () => {
  assert.equal(
    formatMnemonic('<script>alert(1)</script> *eu*'),
    '&lt;script&gt;alert(1)&lt;/script&gt; <em>eu</em>',
  );
});
