import { hanziList } from '../data.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function activePool(selectedCategories) {
  return selectedCategories.length === 0
    ? [...hanziList]
    : hanziList.filter(h => selectedCategories.includes(h.category));
}

export function poolSize(selectedCategories) {
  return activePool(selectedCategories).length;
}

export function buildQuestions(mode, selectedCategories, count) {
  let pool = shuffle(activePool(selectedCategories));
  if (count !== 'all') pool = pool.slice(0, count);

  return pool.map(item => {
    let questionText, qClass, qSub, getVal, optClass;

    if (mode === 'hanzi-to-trans') {
      questionText = item.hanzi;
      qClass       = 'quiz-q-hanzi';
      qSub         = '';
      getVal       = h => h.fcTranslation ?? h.translation;
      optClass     = '';
    } else if (mode === 'trans-to-hanzi') {
      questionText = item.fcTranslation ?? item.translation;
      qClass       = '';
      qSub         = '';
      getVal       = h => h.hanzi;
      optClass     = 'quiz-opt-hanzi';
    } else {
      // pinyin-to-hanzi: show translation as context to avoid tā ambiguity (他/她)
      questionText = item.pinyin;
      qClass       = 'quiz-q-pinyin';
      qSub         = item.fcTranslation ?? item.translation;
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

export function buildStrokeQuestions(selectedCategories, count) {
  let pool = shuffle(activePool(selectedCategories))
    .filter(item => [...item.hanzi].length === 1);
  if (count !== 'all') pool = pool.slice(0, count);
  return pool;
}
