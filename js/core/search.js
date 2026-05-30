import { hanziList } from '../data.js';
import { countryList } from '../countries.js';
import { HSK_LEVELS } from './hsk-levels.js';

export function normalize(str) {
  return (str ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // tone diacritics
    .replace(/[1-5]/g, '')    // numeric tone markers (wo3 → wo)
    .toLowerCase()
    .trim();
}

// ── INDEX ─────────────────────────────────────────────────────
// Each entry splits into two haystacks:
//   core     — hanzi, pinyin, translation, fcTranslation, categoryLabel
//   extended — mnemonic + example text
// A query must pass the full haystack for a match, but scoring rewards
// core hits much more than extended-only hits.

function buildIndex() {
  const entries = [];

  for (const h of hanziList) {
    if (h.category === 'pais') continue;
    const exText = (h.examples ?? []).map(e => `${e.zh} ${e.pt ?? ''}`).join(' ');
    const core = normalize([
      h.hanzi, h.pinyin, h.translation, h.fcTranslation,
    ].filter(Boolean).join(' '));
    const extended = normalize([h.mnemonic, exText, h.categoryLabel].filter(Boolean).join(' '));

    const hsk = HSK_LEVELS[h.id] ?? null;
    entries.push({
      id:          h.id,
      type:        'hanzi',
      tab:         'flashcards',
      hanzi:       h.hanzi,
      pinyin:      h.pinyin,
      label:       h.fcTranslation ?? h.translation,
      sub:         h.categoryLabel,
      hsk,
      pinyinNorm:  normalize(h.pinyin),
      labelNorm:   normalize(h.translation),
      core,
      haystack:    core + ' ' + extended + (hsk ? ` hsk${hsk} hsk ${hsk}` : ' sem hsk'),
    });
  }

  for (const c of countryList) {
    const core = normalize([c.name, c.hanzi, c.pinyin].join(' '));
    entries.push({
      id:          `pais-${c.id}`,
      type:        'pais',
      tab:         'paises',
      hanzi:       c.hanzi,
      pinyin:      c.pinyin,
      label:       c.name,
      sub:         'País',
      flag:        c.flag,
      pinyinNorm:  normalize(c.pinyin),
      labelNorm:   normalize(c.name),
      core,
      haystack:    core,   // countries have no mnemonic
    });
  }

  return entries;
}

export const searchIndex = buildIndex();

// ── SCORING ───────────────────────────────────────────────────
// Tier 1 — hanzi-exact / hanzi-contains      : 200 / 60
// Tier 2 — pinyin exact / prefix             : 50  / 35
// Tier 3 — label (translation) exact / prefix: 30  / 20
// Tier 4 — any core field contains           : 8
// Tier 5 — extended only (mnemonic/examples) : 1   (sinks to bottom)
//
// The result: items that only appear because of a mnemonic mention
// get score ~1 and rank far below real matches.

export function search(query, limit = 40) {
  const raw = (query ?? '').trim();
  const nq  = normalize(raw);
  if (!nq) return [];
  const terms = nq.split(/\s+/).filter(Boolean);

  const scored = [];

  for (const item of searchIndex) {
    if (!terms.every(t => item.haystack.includes(t))) continue;

    let score = 0;

    // hanzi-level (raw, undiacritized input vs the Chinese chars)
    if (item.hanzi === raw)             score += 200;
    else if (item.hanzi.includes(raw))  score += 60;

    // per-term scoring across tiers
    for (const t of terms) {
      if (item.pinyinNorm === t)              score += 50;
      else if (item.pinyinNorm.startsWith(t)) score += 35;

      if (item.labelNorm === t)               score += 30;
      else if (item.labelNorm.startsWith(t))  score += 20;
      else if (item.labelNorm.includes(t))    score += 10;

      // core contains the term at all (but didn't match the specific tiers above)
      if (score === 0 && item.core.includes(t)) score += 8;
    }

    // if nothing scored above zero the term only matched in extended fields
    if (score === 0) score = 1;

    scored.push({ item, score });
  }

  // primary sort: score desc; tiebreak: label alphabetical
  scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));

  // drop extended-only matches when there are real core matches available
  const hasCoreMatch = scored.some(r => r.score > 1);
  const filtered = hasCoreMatch ? scored.filter(r => r.score > 1) : scored;

  return filtered.slice(0, limit).map(r => r.item);
}
