import assert from 'node:assert/strict';
import test from 'node:test';

import {
  categories,
  countryItems,
  hanziList,
  validateCatalog,
  vocabularyList,
} from '../js/data/catalog.js';

test('current catalog is valid and preserves expected sizes', () => {
  assert.doesNotThrow(() => validateCatalog());
  assert.equal(vocabularyList.length, 235);
  assert.equal(countryItems.length, 100);
  assert.equal(hanziList.length, 335);
});

test('duplicate catalog IDs fail validation', () => {
  assert.throws(
    () => validateCatalog({
      countryItems: [...countryItems, { ...countryItems[0] }],
    }),
    /Duplicate catalog IDs/,
  );
});

test('items require an explicit HSK value', () => {
  const { hsk: _, ...itemWithoutHsk } = vocabularyList[0];
  assert.throws(
    () => validateCatalog({
      vocabularyList: [itemWithoutHsk, ...vocabularyList.slice(1)],
    }),
    /Invalid HSK level/,
  );
});

test('unknown categories fail validation', () => {
  assert.throws(
    () => validateCatalog({
      vocabularyList: [
        ...vocabularyList.slice(0, -1),
        { ...vocabularyList.at(-1), category: 'missing-category' },
      ],
    }),
    /Unknown categories/,
  );
});

test('duplicate category IDs fail validation', () => {
  assert.throws(
    () => validateCatalog({
      categories: [...categories, { ...categories[0] }],
    }),
    /Duplicate category IDs/,
  );
});

test('vocabulary uses structured translations, English categories, and no legacy fields', () => {
  const legacyFields = ['tone', 'categoryLabel', 'translation', 'fcTranslation', 'mnemonic'];

  assert.equal(vocabularyList[0].category, 'pronoun');
  assert.equal(vocabularyList[0].translations.pt.primary, 'eu, me, mim');
  assert.equal(vocabularyList[0].translations.pt.short, 'eu · me · mim');
  assert.equal(vocabularyList[1].translations.pt.short, vocabularyList[1].translations.pt.primary);
  assert.ok(vocabularyList.every(item => legacyFields.every(field => !(field in item))));
});

test('compound tones and derived country tones are preserved', () => {
  assert.deepEqual(vocabularyList.find(item => item.id === 'renshi').tones, [4, 0]);
  assert.deepEqual(vocabularyList.find(item => item.id === 'da-dianhua').tones, [3, 4, 4]);
  assert.deepEqual(countryItems.find(item => item.id === 'pais-cn').tones, [1, 2]);
});

test('invalid tones, translations, labels, and examples fail validation', () => {
  const base = vocabularyList[0];
  const validateItem = item => validateCatalog({
    vocabularyList: [item, ...vocabularyList.slice(1)],
  });

  assert.throws(() => validateItem({ ...base, tones: [] }), /Invalid tones/);
  assert.throws(() => validateItem({ ...base, translations: { pt: { short: 'eu' } } }), /Missing Portuguese translation/);
  assert.throws(() => validateItem({ ...base, labels: { pt: {} } }), /Missing Portuguese category label/);
  assert.throws(() => validateItem({ ...base, examples: [{ zh: '我' }] }), /Invalid example/);
});
