const KEY = 'quiz-settings';

export function loadQuizSettings() {
  try { return JSON.parse(localStorage.getItem(KEY)); }
  catch { return null; }
}

export function saveQuizSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
