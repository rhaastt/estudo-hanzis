import { categories, hanziList } from './data.js';
import {
  createGuideGroup,
  createFlashCard,
  createFilterButton,
  createToneSummary,
} from './render.js';

const state = {
  activeFilter: 'all',
  filteredItems: [],
  renderedCount: 0,
  flippedIds: new Set(),
  observer: null,
};

const BATCH_SIZE = 24;

const guideContainer  = document.getElementById('guideContainer');
const filterContainer = document.getElementById('filterContainer');
const fcGrid          = document.getElementById('fcGrid');
const sentinel        = document.getElementById('sentinel');
const progressFill    = document.getElementById('progressFill');
const fcCounter       = document.getElementById('fcCounter');
const resetBtn        = document.getElementById('resetBtn');
const tabsContainer   = document.getElementById('tabsContainer');

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
    if (cat.id === 'all') continue;
    const items = hanziList.filter(h => h.category === cat.id);
    if (items.length === 0) continue;
    guideContainer.appendChild(createGuideGroup(cat, items));
  }
  guideContainer.appendChild(createToneSummary());
}

// ── FILTER BUTTONS ────────────────────────────────────────────
function renderFilters() {
  filterContainer.innerHTML = '';
  for (const cat of categories) {
    const btn = createFilterButton(cat, cat.id === state.activeFilter);
    filterContainer.appendChild(btn);
  }
}

// ── LAZY LOAD ─────────────────────────────────────────────────
function renderBatch() {
  const slice = state.filteredItems.slice(
    state.renderedCount,
    state.renderedCount + BATCH_SIZE,
  );
  for (const item of slice) {
    const card = createFlashCard(item);
    if (state.flippedIds.has(item.id)) card.classList.add('flipped');
    fcGrid.appendChild(card);
  }
  state.renderedCount += slice.length;
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
tabsContainer.addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  const tabId = btn.dataset.tab;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
  // flippedIds and renderedCount intentionally preserved across tab switches
});

// ── FILTER EVENTS ─────────────────────────────────────────────
filterContainer.addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn || btn.dataset.cat === state.activeFilter) return;

  state.activeFilter = btn.dataset.cat;

  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // filter change resets flip state
  state.flippedIds.clear();
  state.filteredItems = state.activeFilter === 'all'
    ? [...hanziList]
    : hanziList.filter(h => h.category === state.activeFilter);
  state.renderedCount = 0;

  fcGrid.innerHTML = '';
  renderBatch();
  updateProgress();
  activateObserver();
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

// ── INIT ─────────────────────────────────────────────────────
function init() {
  validate();
  renderFilters();
  renderGuide();
  state.filteredItems = [...hanziList];
  renderBatch();
  updateProgress();
  activateObserver();
}

init();
