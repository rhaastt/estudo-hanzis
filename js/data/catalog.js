import { inferTonesFromPinyin } from '../core/vocabulary.js';
import { categories } from './categories.js';
import { countryList } from './countries.js';
import { vocabularyList } from './vocabulary.js';

const countryItems = countryList.map(c => ({
  id: `pais-${c.id}`,
  hanzi: c.hanzi,
  pinyin: c.pinyin,
  tones: inferTonesFromPinyin(c.pinyin),
  category: 'country',
  hsk: null,
  labels: {
    pt: { category: 'País' },
  },
  translations: {
    pt: {
      primary: c.name,
      short: c.name,
      mnemonic: '',
    },
  },
  examples: [],
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

  for (const item of catalogItems) {
    if (!Array.isArray(item.tones) || item.tones.length === 0 ||
        item.tones.some(tone => !Number.isInteger(tone) || tone < 0 || tone > 4)) {
      errors.push(`Invalid tones on item: ${item.id}`);
    }
    if (!Object.hasOwn(item, 'hsk') ||
        (item.hsk !== null && (!Number.isInteger(item.hsk) || item.hsk < 1 || item.hsk > 6))) {
      errors.push(`Invalid HSK level on item: ${item.id}`);
    }
    if (!item.translations?.pt?.primary || !item.translations?.pt?.short) {
      errors.push(`Missing Portuguese translation on item: ${item.id}`);
    }
    if (!item.labels?.pt?.category) {
      errors.push(`Missing Portuguese category label on item: ${item.id}`);
    }
    if (!Array.isArray(item.examples)) {
      errors.push(`Invalid examples on item: ${item.id}`);
      continue;
    }
    for (const example of item.examples) {
      if (!example.zh || typeof example.translations?.pt !== 'string') {
        errors.push(`Invalid example on item: ${item.id}`);
      }
    }
  }

  if (errors.length) {
    throw new Error(`[catalog] Invalid catalog:\n- ${errors.join('\n- ')}`);
  }
}

validateCatalog();

export { categories, countryItems, hanziList, vocabularyList };
