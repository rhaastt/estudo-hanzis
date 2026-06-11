import { hanziList } from '../data/catalog.js';
import { shortTranslation } from './vocabulary.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function activePool(selectedCategories, itemIds) {
  if (itemIds && itemIds.length > 0)
    return hanziList.filter(h => itemIds.includes(h.id));
  return selectedCategories.length === 0
    ? [...hanziList]
    : hanziList.filter(h => selectedCategories.includes(h.category));
}

export function eligiblePool(mode, selectedCategories, itemIds) {
  const pool = activePool(selectedCategories, itemIds);
  return mode === 'stroke-order'
    ? pool.filter(item => [...item.hanzi].length === 1)
    : pool;
}

export function poolSize(mode, selectedCategories, itemIds) {
  return eligiblePool(mode, selectedCategories, itemIds).length;
}

export function buildQuestions(mode, selectedCategories, count, itemIds) {
  let pool = shuffle(eligiblePool(mode, selectedCategories, itemIds));
  if (count !== 'all') pool = pool.slice(0, count);

  return pool.map(item => {
    let questionText, qClass, qSub, getVal, optClass;

    if (mode === 'hanzi-to-trans') {
      questionText = item.hanzi;
      qClass       = 'quiz-q-hanzi';
      qSub         = '';
      getVal       = h => shortTranslation(h);
      optClass     = '';
    } else if (mode === 'trans-to-hanzi') {
      questionText = shortTranslation(item);
      qClass       = '';
      qSub         = '';
      getVal       = h => h.hanzi;
      optClass     = 'quiz-opt-hanzi';
    } else {
      // pinyin-to-hanzi: show translation as context to avoid tā ambiguity (他/她)
      questionText = item.pinyin;
      qClass       = 'quiz-q-pinyin';
      qSub         = shortTranslation(item);
      getVal       = h => h.hanzi;
      optClass     = 'quiz-opt-hanzi';
    }

    const correctAnswer = getVal(item);
    const wrongItems    = shuffle(hanziList.filter(h => h.id !== item.id && getVal(h) !== correctAnswer)).slice(0, 3);
    const allPairs      = shuffle([
      { value: correctAnswer, src: item },
      ...wrongItems.map(wi => ({ value: getVal(wi), src: wi })),
    ]);
    const options     = allPairs.map(p => p.value);
    const optionItems = allPairs.map(p => p.src);

    return { questionText, qClass, qSub, options, optionItems, optClass, correctIndex: options.indexOf(correctAnswer) };
  });
}

export function buildStrokeQuestions(selectedCategories, count, itemIds) {
  let pool = shuffle(eligiblePool('stroke-order', selectedCategories, itemIds));
  if (count !== 'all') pool = pool.slice(0, count);
  return pool;
}
