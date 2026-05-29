import { categories, hanziList } from './data.js';
import { countryList } from './countries.js';
import {
  createGuideGroup,
  createFlashCard,
  createFilterButton,
  createCategoryHeader,
  createToneSummary,
} from './render.js';

const state = {
  activeFilter: 'all',
  searchTerm: '',
  filteredItems: [],
  renderedCount: 0,
  lastRenderedCat: null,
  catCounts: {},
  flippedIds: new Set(),
  observer: null,
};

// category id → category object, for headers
const categoryById = new Map(categories.map(c => [c.id, c]));

const BATCH_SIZE = 24;

const guideContainer  = document.getElementById('guideContainer');
const filterContainer = document.getElementById('filterContainer');
const fcGrid          = document.getElementById('fcGrid');
const sentinel        = document.getElementById('sentinel');
const progressFill    = document.getElementById('progressFill');
const fcCounter       = document.getElementById('fcCounter');
const resetBtn        = document.getElementById('resetBtn');
const tabsContainer   = document.getElementById('tabsContainer');
const mobileNav       = document.getElementById('mobileNav');
const searchInput     = document.getElementById('fcSearch');
const paisesContainer = document.getElementById('paisesContainer');

// strip tone diacritics so "ni" matches "nǐ"
function normalize(str) {
  return (str ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// ── VALIDATION ────────────────────────────────────────────────
function validate() {
  const ids = hanziList.map(h => h.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) console.warn('[data] Duplicate IDs:', dupes);

  const catIds = new Set(categories.map(c => c.id));
  for (const h of hanziList) {
    if (!catIds.has(h.category)) {
      console.warn(`[data] Orphan category "${h.category}" on item "${h.id}"`);
    }
  }
}

// ── GUIDE ─────────────────────────────────────────────────────
function renderGuide() {
  guideContainer.innerHTML = '';
  for (const cat of categories) {
    if (cat.id === 'all' || cat.id === 'pais') continue;
    const items = hanziList.filter(h => h.category === cat.id);
    if (items.length === 0) continue;
    guideContainer.appendChild(createGuideGroup(cat, items));
  }
  guideContainer.appendChild(createToneSummary());
}

// ── HANZI WRITER ─────────────────────────────────────────────
const CAT_COLOR = {
  pronome: '#4070C0', verbo: '#B04040', adverbio: '#307A40',
  particula: '#A06020', substantivo: '#7040B0', adjetivo: '#8A6000',
  numero: '#3A5080', lingua: '#A04090', interrogativo: '#207860',
  'nome-proprio': '#8A2A30', conectivo: '#808000',
};

function initHanziWriters() {
  if (typeof HanziWriter === 'undefined') return;
  fcGrid.querySelectorAll('.fc-hw-target:not([data-hw-initialized])').forEach(el => {
    const cat = el.closest('.fc-item')?.dataset.cat ?? '';
    HanziWriter.create(el, el.dataset.hw, {
      width: 90,
      height: 90,
      padding: 5,
      strokeColor: CAT_COLOR[cat] ?? '#333',
      outlineColor: 'rgba(0,0,0,0.12)',
      showCharacter: true,
      showOutline: true,
    });
    el.dataset.hwInitialized = '1';
  });
}

// ── FILTER BUTTONS ────────────────────────────────────────────
function renderFilters() {
  filterContainer.innerHTML = '';
  for (const cat of categories) {
    if (cat.id === 'pais') continue;
    const btn = createFilterButton(cat, cat.id === state.activeFilter);
    filterContainer.appendChild(btn);
  }
}

// ── LAZY LOAD ─────────────────────────────────────────────────
function renderBatch() {
  const grouped = state.activeFilter === 'all';
  const slice = state.filteredItems.slice(
    state.renderedCount,
    state.renderedCount + BATCH_SIZE,
  );
  for (const item of slice) {
    if (grouped && item.category !== state.lastRenderedCat) {
      const cat = categoryById.get(item.category);
      if (cat) fcGrid.appendChild(createCategoryHeader(cat, state.catCounts[item.category] ?? 0));
      state.lastRenderedCat = item.category;
    }
    const card = createFlashCard(item);
    if (state.flippedIds.has(item.id)) card.classList.add('flipped');
    fcGrid.appendChild(card);
  }
  state.renderedCount += slice.length;
  initHanziWriters();
}

function activateObserver() {
  if (state.renderedCount >= state.filteredItems.length) return;

  if (!('IntersectionObserver' in window)) {
    while (state.renderedCount < state.filteredItems.length) renderBatch();
    return;
  }

  if (state.observer) state.observer.disconnect();

  state.observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    renderBatch();
    updateProgress();
    if (state.renderedCount >= state.filteredItems.length) {
      state.observer.disconnect();
      state.observer = null;
    }
  });
  state.observer.observe(sentinel);
}

// ── PROGRESS ─────────────────────────────────────────────────
function updateProgress() {
  const total   = state.filteredItems.length;
  const flipped = state.filteredItems.filter(h => state.flippedIds.has(h.id)).length;
  const pct     = total > 0 ? (flipped / total) * 100 : 0;
  progressFill.style.width = pct + '%';
  fcCounter.textContent    = `${flipped} / ${total} virados`;
}

// ── TABS ─────────────────────────────────────────────────────
function switchTab(tabId) {
  // flippedIds and renderedCount intentionally preserved across tab switches
  document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === tabId));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
}

tabsContainer.addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn');
  if (btn) switchTab(btn.dataset.tab);
});

mobileNav.addEventListener('click', e => {
  const btn = e.target.closest('.mobile-nav-btn');
  if (btn) switchTab(btn.dataset.tab);
});

// ── FLASH CARD FILTERS (category + search) ───────────────────
function computeFiltered() {
  const term = normalize(state.searchTerm.trim());
  const matchesSearch = h => {
    if (!term) return true;
    return h.hanzi.includes(state.searchTerm.trim()) ||
      normalize(h.pinyin).includes(term) ||
      normalize(h.translation).includes(term) ||
      normalize(h.fcTranslation).includes(term);
  };

  let items;
  if (state.activeFilter === 'all') {
    // grouped: walk categories in their defined order so cards cluster by category
    items = [];
    for (const cat of categories) {
      if (cat.id === 'all' || cat.id === 'pais') continue;
      items.push(...hanziList.filter(h => h.category === cat.id && matchesSearch(h)));
    }
  } else {
    items = hanziList.filter(h => h.category === state.activeFilter && matchesSearch(h));
  }

  // per-category counts for the section headers
  state.catCounts = {};
  for (const h of items) {
    state.catCounts[h.category] = (state.catCounts[h.category] ?? 0) + 1;
  }
  return items;
}

function rerenderFlash() {
  state.filteredItems = computeFiltered();
  state.renderedCount = 0;
  state.lastRenderedCat = null;
  fcGrid.innerHTML = '';
  renderBatch();
  if (state.filteredItems.length === 0) {
    fcGrid.innerHTML = '<p class="fc-empty">Nenhum resultado encontrado.</p>';
  }
  updateProgress();
  activateObserver();
}

filterContainer.addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn || btn.dataset.cat === state.activeFilter) return;

  state.activeFilter = btn.dataset.cat;

  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // category change resets flip state
  state.flippedIds.clear();
  rerenderFlash();
});

searchInput.addEventListener('input', () => {
  state.searchTerm = searchInput.value;
  rerenderFlash();
});

// ── FLIP EVENTS ───────────────────────────────────────────────
fcGrid.addEventListener('click', e => {
  const card = e.target.closest('.fc-item');
  if (!card) return;
  const id = card.dataset.id;
  card.classList.toggle('flipped');
  if (card.classList.contains('flipped')) {
    state.flippedIds.add(id);
  } else {
    state.flippedIds.delete(id);
  }
  updateProgress();
});

// ── RESET ─────────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  state.flippedIds.clear();
  fcGrid.querySelectorAll('.fc-item').forEach(c => c.classList.remove('flipped'));
  updateProgress();
});

// ── PAÍSES ───────────────────────────────────────────────────
function renderCountries() {
  const grid = document.createElement('div');
  grid.className = 'country-grid';

  for (const c of countryList) {
    const card = document.createElement('div');
    card.className = 'country-card';
    card.innerHTML = `
      <div class="country-inner">
        <div class="country-front">
          <img class="country-flag" src="${c.flag}" alt="Bandeira de ${c.name}" loading="lazy">
          <span class="country-name">${c.name}</span>
        </div>
        <div class="country-back">
          <div class="country-hanzi">${c.hanzi}</div>
          <div class="country-pinyin">${c.pinyin}</div>
          <div class="country-name-back">${c.name}</div>
        </div>
      </div>
    `;
    card.addEventListener('click', () => card.classList.toggle('flipped'));
    grid.appendChild(card);
  }

  paisesContainer.appendChild(grid);
}

// ── INIT ─────────────────────────────────────────────────────
function init() {
  validate();
  renderFilters();
  renderGuide();
  state.filteredItems = computeFiltered();
  renderBatch();
  updateProgress();
  activateObserver();
  renderCountries();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

init();
