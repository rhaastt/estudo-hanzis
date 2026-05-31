import assert from 'node:assert/strict';
import test from 'node:test';

import {
  categories,
  countryItems,
  hanziList,
  validateCatalog,
  vocabularyList,
} from '../js/data/catalog.js';
import { HSK_LEVELS } from '../js/core/hsk-levels.js';

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

test('vocabulary items require an explicit HSK entry', () => {
  const { [vocabularyList[0].id]: _, ...hskLevels } = HSK_LEVELS;

  assert.throws(
    () => validateCatalog({ hskLevels }),
    /Missing explicit HSK levels/,
  );
});

test('orphan HSK entries fail validation', () => {
  assert.throws(
    () => validateCatalog({
      hskLevels: { ...HSK_LEVELS, orphan: null },
    }),
    /HSK levels without vocabulary items/,
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
