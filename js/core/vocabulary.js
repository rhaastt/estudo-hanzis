const TONE_MARKS = new Map([
  ['\u0304', 1],
  ['\u0301', 2],
  ['\u030c', 3],
  ['\u0300', 4],
]);

export function inferTonesFromPinyin(pinyin) {
  return [...pinyin.normalize('NFD')]
    .map(char => TONE_MARKS.get(char))
    .filter(tone => tone !== undefined);
}

export function primaryTranslation(item) {
  return item.translations.pt.primary;
}

export function shortTranslation(item) {
  return item.translations.pt.short;
}

export function mnemonic(item) {
  return item.translations.pt.mnemonic;
}

export function categoryLabel(item) {
  return item.labels.pt.category;
}

export function firstTone(item) {
  return item.tones[0] ?? 0;
}

export function exampleTranslation(example) {
  return example.translations.pt;
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatMnemonic(text) {
  return escapeHtml(text).replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
