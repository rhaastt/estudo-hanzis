import { hanziList } from '../data.js';
import { countryList } from '../countries.js';

// strip tone diacritics AND tone numbers so "wo3" / "wǒ" / "wo" all match
export function normalize(str) {
  return (str ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // combining diacritics
    .replace(/[1-5]/g, '')           // pinyin tone numbers
    .toLowerCase()
    .trim();
}

// one unified, pre-computed index for the whole app — built once on import
function buildIndex() {
  const entries = [];

  for (const h of hanziList) {
    if (h.category === 'pais') continue; // countries indexed from countryList below
    const exampleText = (h.examples ?? [])
      .map(e => `${e.zh} ${e.pt ?? ''}`)
      .join(' ');
    entries.push({
      id: h.id,
      type: 'hanzi',
      tab: 'flashcards',
      hanzi: h.hanzi,
      pinyin: h.pinyin,
      label: h.fcTranslation ?? h.translation,
      sub: h.categoryLabel,
      pinyinNorm: normalize(h.pinyin),
      labelNorm: normalize(h.translation),
      haystack: normalize([
        h.hanzi, h.pinyin, h.translation, h.fcTranslation,
        h.mnemonic, h.categoryLabel, exampleText,
      ].filter(Boolean).join(' ')),
    });
  }

  for (const c of countryList) {
    entries.push({
      id: `pais-${c.id}`,
      type: 'pais',
      tab: 'paises',
      hanzi: c.hanzi,
      pinyin: c.pinyin,
      label: c.name,
      sub: 'País',
      flag: c.flag,
      pinyinNorm: normalize(c.pinyin),
      labelNorm: normalize(c.name),
      haystack: normalize([c.name, c.hanzi, c.pinyin].join(' ')),
    });
  }

  return entries;
}

export const searchIndex = buildIndex();

// AND across terms; ranked so exact hanzi / pinyin / prefix hits float to top
export function search(query, limit = 40) {
  const raw = (query ?? '').trim();
  const nq = normalize(raw);
  if (!nq) return [];
  const terms = nq.split(/\s+/).filter(Boolean);

  const scored = [];
  for (const item of searchIndex) {
    if (!terms.every(t => item.haystack.includes(t))) continue;

    let score = 1;
    if (item.hanzi === raw) score += 200;
    else if (item.hanzi.includes(raw)) score += 60;

    for (const t of terms) {
      if (item.pinyinNorm === t) score += 30;
      else if (item.pinyinNorm.startsWith(t)) score += 22;
      if (item.labelNorm.startsWith(t)) score += 16;
    }
    scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
  return scored.slice(0, limit).map(r => r.item);
}
