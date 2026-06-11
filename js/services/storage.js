const KEY          = 'quiz-settings';
const BARALHOS_KEY = 'baralhos';

export function loadQuizSettings() {
  try { return JSON.parse(localStorage.getItem(KEY)); }
  catch { return null; }
}

export function saveQuizSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function loadBaralhos() {
  try { return JSON.parse(localStorage.getItem(BARALHOS_KEY)) ?? []; }
  catch { return []; }
}

export function saveBaralhos(baralhos) {
  localStorage.setItem(BARALHOS_KEY, JSON.stringify(baralhos));
}
