import { categories, hanziList } from './data.js';
import { countryList } from './countries.js';
import {
  createGuideGroup,
  createFlashCard,
  createFilterButton,
  createCategoryHeader,
  createToneSummary,
} from './render.js';
import {
  createStrokeWriter,
  animateWriter,
  startWriterQuiz,
} from './services/hanzi-writer.js';
import { search } from './core/search.js';

const state = {
  activeFilter: 'all',
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
const resetBtn          = document.getElementById('resetBtn');
const tabsContainer     = document.getElementById('tabsContainer');
const mobileNav         = document.getElementById('mobileNav');
const globalSearchBtn   = document.getElementById('globalSearchBtn');
const mobileSearchBtn   = document.getElementById('mobileSearchBtn');
const paisesContainer   = document.getElementById('paisesContainer');

// stroke-order modal
const hwModal            = document.getElementById('hwModal');
const hwModalCanvas      = document.getElementById('hwModalCanvas');
const hwModalPinyin      = document.getElementById('hwModalPinyin');
const hwModalTranslation = document.getElementById('hwModalTranslation');
const hwModalHint        = document.getElementById('hwModalHint');
const hwAnimateBtn       = document.getElementById('hwAnimate');
const hwPracticeBtn      = document.getElementById('hwPractice');

// command palette (global search)
const cmdk        = document.getElementById('cmdk');
const cmdkInput   = document.getElementById('cmdkInput');
const cmdkResults = document.getElementById('cmdkResults');

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

// ── STROKE-ORDER MODAL ───────────────────────────────────────
let hwWriter = null;

function openHwModal(item) {
  hwModalPinyin.textContent      = item.pinyin;
  hwModalTranslation.textContent = item.fcTranslation ?? item.translation;
  hwModalHint.textContent        = '';
  hwModalCanvas.innerHTML        = '';
  hwModal.hidden = false;
  document.body.classList.add('hw-modal-open');

  hwWriter = createStrokeWriter(hwModalCanvas, item.hanzi, {
    width: 300, height: 300, padding: 20,
    strokeColor:  CAT_COLOR[item.category] ?? '#333',
    outlineColor: 'rgba(0,0,0,0.12)',
    showCharacter: true,
    showOutline: true,
  });

  if (!hwWriter) {
    hwModalHint.textContent = 'Animação de traços indisponível offline.';
    return;
  }
  animateWriter(hwWriter);
}

function closeHwModal() {
  hwModal.hidden = true;
  document.body.classList.remove('hw-modal-open');
  hwModalCanvas.innerHTML = '';
  hwWriter = null;
}

hwAnimateBtn.addEventListener('click', () => {
  hwModalHint.textContent = '';
  animateWriter(hwWriter);
});

hwPracticeBtn.addEventListener('click', () => {
  if (!hwWriter) return;
  hwModalHint.textContent = 'Desenhe o caractere traço a traço.';
  startWriterQuiz(hwWriter, {
    onComplete: () => { hwModalHint.textContent = 'Muito bem! ✓'; },
  });
});

hwModal.addEventListener('click', e => {
  if (e.target.closest('[data-hw-close]')) closeHwModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !hwModal.hidden) closeHwModal();
});

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
  if (typeof lucide !== 'undefined') lucide.createIcons();
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

// ── FLASH CARD FILTERS (category) ────────────────────────────
function computeFiltered() {
  let items;
  if (state.activeFilter === 'all') {
    // grouped: walk categories in their defined order so cards cluster by category
    items = [];
    for (const cat of categories) {
      if (cat.id === 'all' || cat.id === 'pais') continue;
      items.push(...hanziList.filter(h => h.category === cat.id));
    }
  } else {
    items = hanziList.filter(h => h.category === state.activeFilter);
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

globalSearchBtn.addEventListener('click', openCmdk);
mobileSearchBtn.addEventListener('click', openCmdk);

// ── FLIP EVENTS ───────────────────────────────────────────────
fcGrid.addEventListener('click', e => {
  // stroke button opens the modal without flipping the card
  const hwBtn = e.target.closest('.fc-hw-btn');
  if (hwBtn) {
    const card = hwBtn.closest('.fc-item');
    const item = hanziList.find(h => h.id === card?.dataset.id);
    if (item) openHwModal(item);
    return;
  }

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
    card.dataset.id = `pais-${c.id}`;
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

// ── COMMAND PALETTE (global search) ──────────────────────────
const cmdkState = { results: [], active: 0 };

const TYPE_LABEL = { hanzi: 'Flash Card', pais: 'País' };

function openCmdk() {
  if (!cmdk.hidden) return;
  cmdk.hidden = false;
  document.body.classList.add('cmdk-open');
  cmdkInput.value = '';
  renderCmdkResults([]);
  // defer focus so a click that opened it doesn't immediately blur
  requestAnimationFrame(() => cmdkInput.focus());
}

function closeCmdk() {
  if (cmdk.hidden) return;
  cmdk.hidden = true;
  document.body.classList.remove('cmdk-open');
  cmdkInput.blur();
  if (document.activeElement === searchInput) searchInput.blur();
}

function renderCmdkResults(items) {
  cmdkState.results = items;
  cmdkState.active = 0;

  if (cmdkInput.value.trim() && items.length === 0) {
    cmdkResults.innerHTML = '<div class="cmdk-empty">Nenhum resultado encontrado.</div>';
    return;
  }
  if (items.length === 0) {
    cmdkResults.innerHTML = '<div class="cmdk-empty">Digite para buscar hanzi, pinyin, tradução ou país.</div>';
    return;
  }

  cmdkResults.innerHTML = items.map((item, i) => `
    <button class="cmdk-result${i === 0 ? ' active' : ''}" data-index="${i}" type="button">
      <span class="cmdk-result-hanzi">${item.hanzi}</span>
      <span class="cmdk-result-body">
        <span class="cmdk-result-label">${item.label}</span>
        <span class="cmdk-result-sub">${item.pinyin} · ${item.sub}</span>
      </span>
      <span class="cmdk-result-tag">${TYPE_LABEL[item.type] ?? ''}</span>
    </button>
  `).join('');
}

function setActiveResult(idx) {
  const btns = cmdkResults.querySelectorAll('.cmdk-result');
  if (btns.length === 0) return;
  cmdkState.active = (idx + btns.length) % btns.length;
  btns.forEach((b, i) => b.classList.toggle('active', i === cmdkState.active));
  btns[cmdkState.active].scrollIntoView({ block: 'nearest' });
}

function highlightEl(el) {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('search-highlight');
  setTimeout(() => el.classList.remove('search-highlight'), 1600);
}

// render flash-card batches until the target card exists in the DOM
function ensureCardRendered(id) {
  let guard = 0;
  while (
    !fcGrid.querySelector(`.fc-item[data-id="${id}"]`) &&
    state.renderedCount < state.filteredItems.length &&
    guard++ < 200
  ) {
    renderBatch();
  }
}

function gotoResult(item) {
  closeCmdk();
  switchTab(item.tab);

  if (item.type === 'hanzi') {
    // a category filter could hide the target — reset to "all" so it's present
    if (state.activeFilter !== 'all') {
      state.activeFilter = 'all';
      document.querySelectorAll('.filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.cat === 'all'));
      rerenderFlash();
    }
    ensureCardRendered(item.id);
    highlightEl(fcGrid.querySelector(`.fc-item[data-id="${item.id}"]`));
  } else {
    highlightEl(paisesContainer.querySelector(`.country-card[data-id="${item.id}"]`));
  }
}

cmdkInput.addEventListener('input', () => {
  renderCmdkResults(search(cmdkInput.value));
});

cmdkInput.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); setActiveResult(cmdkState.active + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveResult(cmdkState.active - 1); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    const item = cmdkState.results[cmdkState.active];
    if (item) gotoResult(item);
  }
});

cmdkResults.addEventListener('click', e => {
  const btn = e.target.closest('.cmdk-result');
  if (!btn) return;
  const item = cmdkState.results[Number(btn.dataset.index)];
  if (item) gotoResult(item);
});

cmdk.addEventListener('click', e => {
  if (e.target.closest('[data-cmdk-close]')) closeCmdk();
});

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    cmdk.hidden ? openCmdk() : closeCmdk();
  } else if (e.key === 'Escape' && !cmdk.hidden) {
    closeCmdk();
  }
});

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
