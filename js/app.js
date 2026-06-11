import { categories, hanziList } from './data/catalog.js';
import { countryList } from './data/countries.js';
import {
  createGuideGroup,
  createFlashCard,
  createCategoryHeader,
  createToneSummary,
} from './render.js';
import {
  createStrokeWriter,
  animateWriter,
  startWriterQuiz,
} from './services/hanzi-writer.js';
import { search } from './core/search.js';
import { HSK_FILTER_OPTIONS } from './core/hsk.js';
import { hskColor } from './core/hsk-colors.js';
import { primaryTranslation } from './core/vocabulary.js';
import { loadBaralhos, saveBaralhos } from './services/storage.js';
import { criarBaralho, toggleItem, validarIds } from './core/baralhos.js';

const state = {
  activeFilter: 'all',
  filteredItems: [],
  renderedCount: 0,
  lastRenderedCat: null,
  catCounts: {},
  flippedIds: new Set(),
  observer: null,
};

const validIds = new Set(hanziList.map(h => h.id));

const baralhoState = {
  baralhos: loadBaralhos().map(b => { validarIds(b, validIds); return b; }),
  activeId: null,
};

// category id → category object, for headers
const categoryById = new Map(categories.map(c => [c.id, c]));

const BATCH_SIZE = 24;

const baralhoContainer = document.getElementById('baralhoContainer');
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

// ── STROKE-ORDER MODAL ───────────────────────────────────────
let hwWriter = null;

function openHwModal(item) {
  hwModalPinyin.textContent      = item.pinyin;
  hwModalTranslation.textContent = primaryTranslation(item);
  hwModalHint.textContent        = '';
  hwModalCanvas.innerHTML        = '';
  hwModal.hidden = false;
  document.body.classList.add('hw-modal-open');

  hwWriter = createStrokeWriter(hwModalCanvas, item.hanzi, {
    width: 300, height: 300, padding: 20,
    strokeColor:  hskColor(item.hsk ?? null),
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

// ── BARALHOS ──────────────────────────────────────────────────
function updateMarkerButtons() {
  const { baralhos, activeId } = baralhoState;
  const markedIds = activeId
    ? new Set(baralhos.find(b => b.id === activeId)?.ids ?? [])
    : new Set(baralhos.flatMap(b => b.ids));
  fcGrid.querySelectorAll('.fc-marker-btn').forEach(btn => {
    const marked = markedIds.has(btn.dataset.id);
    btn.classList.toggle('marked', marked);
    btn.textContent = marked ? '★' : '☆';
  });
}

function renderBaralhoPanel() {
  baralhoContainer.innerHTML = '';

  const newBtn = document.createElement('button');
  newBtn.className = 'baralho-new-btn';
  newBtn.textContent = '+ Novo baralho';
  newBtn.addEventListener('click', () => {
    const nome = prompt('Nome do baralho:')?.trim();
    if (!nome) return;
    const b = criarBaralho(nome);
    baralhoState.baralhos.push(b);
    baralhoState.activeId = b.id;
    saveBaralhos(baralhoState.baralhos);
    renderBaralhoPanel();
    updateMarkerButtons();
  });
  baralhoContainer.appendChild(newBtn);

  for (const b of baralhoState.baralhos) {
    const pill = document.createElement('div');
    pill.className = 'baralho-pill' + (b.id === baralhoState.activeId ? ' active' : '');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = b.nome;

    const countSpan = document.createElement('span');
    countSpan.className = 'baralho-pill-count';
    countSpan.textContent = b.ids.length;

    const actions = document.createElement('div');
    actions.className = 'baralho-pill-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'baralho-pill-btn';
    editBtn.title = 'Renomear';
    editBtn.textContent = '✏';
    editBtn.addEventListener('click', e => {
      e.stopPropagation();
      const nome = prompt('Novo nome:', b.nome)?.trim();
      if (!nome) return;
      b.nome = nome;
      saveBaralhos(baralhoState.baralhos);
      renderBaralhoPanel();
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'baralho-pill-btn';
    delBtn.title = 'Deletar';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm(`Deletar baralho "${b.nome}"?`)) return;
      baralhoState.baralhos = baralhoState.baralhos.filter(x => x.id !== b.id);
      if (baralhoState.activeId === b.id) baralhoState.activeId = null;
      saveBaralhos(baralhoState.baralhos);
      renderBaralhoPanel();
      updateMarkerButtons();
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    pill.appendChild(nameSpan);
    pill.appendChild(countSpan);
    pill.appendChild(actions);

    pill.addEventListener('click', () => {
      baralhoState.activeId = baralhoState.activeId === b.id ? null : b.id;
      renderBaralhoPanel();
      updateMarkerButtons();
    });

    baralhoContainer.appendChild(pill);
  }
}

function showMarkerPopover(btn, itemId) {
  document.querySelector('.baralho-popover')?.remove();

  const pop = document.createElement('div');
  pop.className = 'baralho-popover';

  if (baralhoState.baralhos.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'baralho-popover-empty';
    empty.textContent = 'Crie um baralho primeiro';
    pop.appendChild(empty);
  } else {
    for (const b of baralhoState.baralhos) {
      const label = document.createElement('label');
      label.className = 'baralho-popover-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.deck = b.id;
      cb.checked = b.ids.includes(itemId);
      cb.addEventListener('change', () => {
        toggleItem(b, itemId);
        saveBaralhos(baralhoState.baralhos);
        updateMarkerButtons();
        renderBaralhoPanel();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(b.nome));
      pop.appendChild(label);
    }
  }

  const rect = btn.getBoundingClientRect();
  pop.style.top  = `${rect.bottom + 6 + window.scrollY}px`;
  pop.style.left = `${Math.max(8, rect.right - 160 + window.scrollX)}px`;
  document.body.appendChild(pop);

  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!pop.contains(e.target)) {
        pop.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 0);
}

// ── FILTER BUTTONS ────────────────────────────────────────────
function renderFilters() {
  filterContainer.innerHTML = '';
  for (const opt of HSK_FILTER_OPTIONS) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (opt.id === state.activeFilter ? ' active' : '');
    btn.dataset.cat = opt.id;
    btn.textContent = opt.label;
    filterContainer.appendChild(btn);
  }
}

// ── LAZY LOAD ─────────────────────────────────────────────────
function renderBatch() {
  const grouped = true;
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
  updateMarkerButtons();
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

// ── FLASH CARD FILTERS (HSK level) ───────────────────────────
function matchesHsk(item) {
  const lvl = item.hsk ?? null;
  if (state.activeFilter === 'all')  return true;
  if (state.activeFilter === 'none') return lvl === null;
  if (state.activeFilter === '4')    return lvl !== null && lvl >= 4;
  return lvl === Number(state.activeFilter);
}

function computeFiltered() {
  const items = [];
  for (const cat of categories) {
    if (cat.id === 'all' || cat.id === 'pais') continue;
    items.push(...hanziList.filter(h => h.category === cat.id && matchesHsk(h)));
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
  // marker button — toggle item in/out of baralho
  const markerBtn = e.target.closest('.fc-marker-btn');
  if (markerBtn) {
    const itemId = markerBtn.dataset.id;
    if (baralhoState.activeId) {
      const b = baralhoState.baralhos.find(x => x.id === baralhoState.activeId);
      if (b) {
        toggleItem(b, itemId);
        saveBaralhos(baralhoState.baralhos);
        updateMarkerButtons();
        renderBaralhoPanel();
      }
    } else {
      showMarkerPopover(markerBtn, itemId);
    }
    return;
  }

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
  renderFilters();
  renderBaralhoPanel();
  renderGuide();
  state.filteredItems = computeFiltered();
  renderBatch();
  updateMarkerButtons();
  updateProgress();
  activateObserver();
  renderCountries();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

init();
