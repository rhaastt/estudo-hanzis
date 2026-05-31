import { HSK_LEVELS } from '../core/hsk-levels.js';
import { categories } from './categories.js';
import { countryList } from './countries.js';
import { vocabularyList } from './vocabulary.js';

const countryItems = countryList.map(c => ({
  id: `pais-${c.id}`,
  hanzi: c.hanzi,
  pinyin: c.pinyin,
  tone: 0,
  category: 'pais',
  categoryLabel: 'País',
  translation: c.name,
  fcTranslation: c.name,
}));

const hanziList = [...vocabularyList, ...countryItems];

function duplicateIds(items) {
  const seen = new Set();
  const duplicates = new Set();

  for (const item of items) {
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  }

  return [...duplicates];
}

export function validateCatalog({
  categories: categoryItems = categories,
  vocabularyList: vocabularyItems = vocabularyList,
  countryItems: derivedCountryItems = countryItems,
  hskLevels = HSK_LEVELS,
} = {}) {
  const errors = [];
  const catalogItems = [...vocabularyItems, ...derivedCountryItems];
  const categoryDuplicates = duplicateIds(categoryItems);
  const catalogDuplicates = duplicateIds(catalogItems);

  if (categoryDuplicates.length) {
    errors.push(`Duplicate category IDs: ${categoryDuplicates.join(', ')}`);
  }
  if (catalogDuplicates.length) {
    errors.push(`Duplicate catalog IDs: ${catalogDuplicates.join(', ')}`);
  }

  const categoryIds = new Set(categoryItems.map(category => category.id));
  const invalidCategories = catalogItems
    .filter(item => !categoryIds.has(item.category))
    .map(item => `${item.id} (${item.category})`);
  if (invalidCategories.length) {
    errors.push(`Unknown categories: ${invalidCategories.join(', ')}`);
  }

  const vocabularyIds = new Set(vocabularyItems.map(item => item.id));
  const missingHskLevels = vocabularyItems
    .filter(item => !Object.hasOwn(hskLevels, item.id))
    .map(item => item.id);
  if (missingHskLevels.length) {
    errors.push(`Missing explicit HSK levels: ${missingHskLevels.join(', ')}`);
  }

  const orphanHskLevels = Object.keys(hskLevels)
    .filter(id => !vocabularyIds.has(id));
  if (orphanHskLevels.length) {
    errors.push(`HSK levels without vocabulary items: ${orphanHskLevels.join(', ')}`);
  }

  if (errors.length) {
    throw new Error(`[catalog] Invalid catalog:\n- ${errors.join('\n- ')}`);
  }
}

validateCatalog();

export { categories, countryItems, hanziList, vocabularyList };
