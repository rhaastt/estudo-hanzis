import { categories, hanziList } from './data/catalog.js';
import { state, COUNT_OPTIONS, COUNT_LABELS } from './core/quiz-state.js';
import { poolSize, buildQuestions, buildStrokeQuestions } from './core/quiz-engine.js';
import { loadQuizSettings, saveQuizSettings } from './services/storage.js';
import { createStrokeWriter, animateWriter, startWriterQuiz } from './services/hanzi-writer.js';
import { shortTranslation } from './core/vocabulary.js';

const container = document.getElementById('quizContainer');

// ── SETTINGS PERSISTENCE ─────────────────────────────────────────
function saveSettings() {
  saveQuizSettings({ categories: state.categories, count: state.count });
}

function loadSettings() {
  const saved = loadQuizSettings();
  if (!saved) return;
  const validIds = new Set(categories.map(c => c.id));
  if (Array.isArray(saved.categories))
    state.categories = saved.categories.filter(id => validIds.has(id) && id !== 'all');
  if (saved.count === 'all' || COUNT_OPTIONS.includes(saved.count))
    state.count = saved.count;
}

// ── SELECTOR HELPERS ──────────────────────────────────────────────
function updateCountButtons() {
  const available = poolSize('hanzi-to-trans', state.categories);
  const availabilityLabel = count =>
    `${count} ${count === 1 ? 'disponível' : 'disponíveis'}`;

  if (state.count !== 'all' && state.count > available) {
    state.count = 'all';
    saveSettings();
  }

  container.querySelectorAll('.quiz-count-btn').forEach(btn => {
    const val = btn.dataset.count;
    const n   = val === 'all' ? 0 : +val;
    btn.classList.toggle('quiz-count-btn--dim', n > available);
    btn.classList.toggle('active', val === String(state.count));
  });

  const hint = container.querySelector('#quizAvailableHint');
  if (hint) hint.textContent = availabilityLabel(available);

  container.querySelectorAll('.quiz-mode-card').forEach(card => {
    const modeAvailable = poolSize(card.dataset.mode, state.categories);
    const isEmpty = modeAvailable === 0;
    card.disabled = isEmpty;
    card.classList.toggle('quiz-mode-card--empty', isEmpty);
    card.querySelector('.quiz-mode-availability').textContent =
      availabilityLabel(modeAvailable);
  });
}

function updateCatPills() {
  container.querySelectorAll('.quiz-cat-pill').forEach(btn => {
    const cat = btn.dataset.cat;
    btn.classList.toggle('active',
      cat === 'all' ? state.categories.length === 0 : state.categories.includes(cat)
    );
  });
}

// ── MODE SELECTOR ─────────────────────────────────────────────────
function renderModeSelector() {
  const catItemCount = Object.fromEntries(
    categories.map(c => [c.id, c.id === 'all' ? hanziList.length : hanziList.filter(h => h.category === c.id).length])
  );
  const specificCats = categories.filter(c => c.id !== 'all' && catItemCount[c.id] > 0);

  container.innerHTML = `
    <div class="quiz-modes">
      <h2 class="quiz-modes-title">Escolha o modo</h2>
      <p class="quiz-mode-error" id="quizModeError" hidden></p>

      <div class="quiz-settings">
        <div class="quiz-settings-row quiz-settings-row--top">
          <span class="quiz-settings-label">Categoria</span>
          <div class="quiz-cat-pills">
            <button class="quiz-cat-pill${state.categories.length === 0 ? ' active' : ''}" data-cat="all">Todos</button>
            ${specificCats.map(c => `<button class="quiz-cat-pill${state.categories.includes(c.id) ? ' active' : ''}" data-cat="${c.id}">${c.label} <span class="quiz-cat-pill-count">${catItemCount[c.id]}</span></button>`).join('')}
          </div>
        </div>
        <div class="quiz-settings-row">
          <span class="quiz-settings-label">Perguntas</span>
          <div class="quiz-count-group">
            <div class="quiz-count-btns">
              ${COUNT_OPTIONS.map(n => `<button class="quiz-count-btn${n === state.count ? ' active' : ''}" data-count="${n}">${COUNT_LABELS[n]}</button>`).join('')}
            </div>
            <span class="quiz-available-hint" id="quizAvailableHint"></span>
          </div>
        </div>
      </div>

      <div class="quiz-modes-grid">
        <button class="quiz-mode-card" data-mode="hanzi-to-trans">
          <div class="quiz-mode-glyph">汉</div>
          <div class="quiz-mode-name">Hanzi → Tradução</div>
          <div class="quiz-mode-hint">Veja o caractere, escolha o significado</div>
          <div class="quiz-mode-availability"></div>
        </button>
        <button class="quiz-mode-card" data-mode="trans-to-hanzi">
          <div class="quiz-mode-glyph">文</div>
          <div class="quiz-mode-name">Tradução → Hanzi</div>
          <div class="quiz-mode-hint">Veja o significado, escolha o caractere</div>
          <div class="quiz-mode-availability"></div>
        </button>
        <button class="quiz-mode-card" data-mode="pinyin-to-hanzi">
          <div class="quiz-mode-glyph quiz-mode-glyph--pinyin">pīn</div>
          <div class="quiz-mode-name">Pinyin → Hanzi</div>
          <div class="quiz-mode-hint">Veja o pinyin, escolha o caractere</div>
          <div class="quiz-mode-availability"></div>
        </button>
        <button class="quiz-mode-card quiz-mode-card--stroke" data-mode="stroke-order">
          <div class="quiz-mode-glyph">描</div>
          <div class="quiz-mode-name">Escrita de Traços</div>
          <div class="quiz-mode-hint">Observe a animação e escreva o caractere</div>
          <div class="quiz-mode-availability"></div>
        </button>
      </div>
    </div>
  `.trim();

  container.querySelectorAll('.quiz-cat-pill').forEach(btn =>
    btn.addEventListener('click', () => {
      const cat    = btn.dataset.cat;
      const allIds = specificCats.map(c => c.id);
      if (cat === 'all') {
        state.categories = [];
      } else if (state.categories.includes(cat)) {
        state.categories = state.categories.filter(c => c !== cat);
      } else {
        const next = [...state.categories, cat];
        state.categories = allIds.every(id => next.includes(id)) ? [] : next;
      }
      updateCatPills();
      updateCountButtons();
      saveSettings();
    })
  );

  container.querySelectorAll('.quiz-count-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const val = btn.dataset.count;
      state.count = val === 'all' ? 'all' : +val;
      container.querySelectorAll('.quiz-count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveSettings();
    })
  );

  container.querySelectorAll('.quiz-mode-card').forEach(btn =>
    btn.addEventListener('click', () => startQuiz(btn.dataset.mode))
  );

  updateCountButtons();
}

// ── QUIZ START ────────────────────────────────────────────────────
function startQuiz(mode) {
  state.mode      = mode;
  state.questions = mode === 'stroke-order'
    ? buildStrokeQuestions(state.categories, state.count)
    : buildQuestions(mode, state.categories, state.count);
  if (state.questions.length === 0) {
    state.mode = null;
    renderModeSelector();
    const error = document.getElementById('quizModeError');
    error.textContent = 'Nenhum item disponível para este modo com as categorias selecionadas.';
    error.hidden = false;
    return;
  }
  state.current   = 0;
  state.score     = 0;
  state.answered  = false;
  renderQuestion();
}

// ── QUESTION ──────────────────────────────────────────────────────
function renderQuestion() {
  if (state.mode === 'stroke-order') {
    renderStrokeQuestion();
    return;
  }

  state.answered = false;
  const q     = state.questions[state.current];
  const total = state.questions.length;
  const idx   = state.current + 1;

  const LABELS = {
    'hanzi-to-trans': 'O que significa este caractere?',
    'trans-to-hanzi': 'Selecione o caractere correto',
    'pinyin-to-hanzi': 'Qual é o caractere?',
  };

  container.innerHTML = `
    <div class="quiz-screen">
      <div class="quiz-status">
        <span class="quiz-counter">${idx} / ${total}</span>
        <span class="quiz-score-label">${state.score} corretas</span>
      </div>
      <div class="quiz-bar">
        <div class="quiz-bar-fill" style="width:${(idx / total) * 100}%"></div>
      </div>
      <div class="quiz-q-wrap">
        <p class="quiz-q-label">${LABELS[state.mode]}</p>
        <div class="quiz-q-text ${q.qClass}">${q.questionText}</div>
        ${q.qSub ? `<p class="quiz-q-sub">${q.qSub}</p>` : ''}
      </div>
      <div class="quiz-opts">
        ${q.options.map((opt, i) => {
          const src = q.optionItems[i];
          return `
            <div class="quiz-opt-card${q.optClass ? ` ${q.optClass}` : ''}" data-idx="${i}">
              <div class="quiz-opt-inner">
                <div class="quiz-opt-front">${opt}</div>
                <div class="quiz-opt-back">
                  <div class="quiz-opt-back-hanzi">${src.hanzi}</div>
                  <div class="quiz-opt-back-pinyin">${src.pinyin}</div>
                  <div class="quiz-opt-back-trans">${shortTranslation(src)}</div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
      <div class="quiz-foot">
        <button class="quiz-quit" id="quizQuit">Encerrar</button>
        <button class="quiz-next" id="quizNext" disabled>
          ${state.current < total - 1 ? 'Próxima' : 'Ver resultado'}
        </button>
      </div>
    </div>
  `.trim();

  container.querySelectorAll('.quiz-opt-card').forEach(card =>
    card.addEventListener('click', () => handleAnswer(+card.dataset.idx))
  );
  document.getElementById('quizNext').addEventListener('click', advance);
  document.getElementById('quizQuit').addEventListener('click', () => {
    const answered = state.answered ? state.current + 1 : state.current;
    renderResult(answered);
  });
}

function handleAnswer(idx) {
  if (state.answered) return;
  state.answered = true;

  const q = state.questions[state.current];
  if (idx === q.correctIndex) state.score++;

  container.querySelectorAll('.quiz-opt-card').forEach((card, i) => {
    card.style.pointerEvents = 'none';
    if (i === q.correctIndex)                card.classList.add('quiz-opt-correct');
    if (i === idx && idx !== q.correctIndex) card.classList.add('quiz-opt-wrong');
    card.classList.add('flipped');
  });

  document.getElementById('quizNext').disabled = false;
}

// ── STROKE ORDER MODULE ───────────────────────────────────────────
function renderStrokeQuestion() {
  state.answered = false;
  const item  = state.questions[state.current];
  const total = state.questions.length;
  const idx   = state.current + 1;

  container.innerHTML = `
    <div class="quiz-screen">
      <div class="quiz-status">
        <span class="quiz-counter">${idx} / ${total}</span>
        <span class="quiz-score-label">${state.score} perfeitas</span>
      </div>
      <div class="quiz-bar">
        <div class="quiz-bar-fill" style="width:${(idx / total) * 100}%"></div>
      </div>
      <div class="quiz-stroke-wrap">
        <p class="quiz-q-label">Observe a animação e escreva</p>
        <div class="quiz-stroke-prompt">
          <div class="quiz-stroke-trans">${shortTranslation(item)}</div>
          <div class="quiz-stroke-pinyin">${item.pinyin}</div>
        </div>
        <div class="quiz-stroke-canvas" id="quizHWCanvas"></div>
        <p class="quiz-stroke-hint" id="quizStrokeHint">Observe os traços — em seguida escreva</p>
        <button class="quiz-stroke-replay" id="quizStrokeReplay" disabled>Rever animação</button>
      </div>
      <div class="quiz-foot">
        <button class="quiz-quit" id="quizQuit">Encerrar</button>
        <button class="quiz-next" id="quizNext" disabled>
          ${state.current < total - 1 ? 'Próxima' : 'Ver resultado'}
        </button>
      </div>
    </div>
  `.trim();

  const el     = document.getElementById('quizHWCanvas');
  const writer = createStrokeWriter(el, item.hanzi, {
    width: 220, height: 220, padding: 10,
    showCharacter: true, showOutline: true,
    strokeColor: '#2D2926', outlineColor: 'rgba(0,0,0,0.12)',
    highlightColor: '#4070C0', drawingColor: '#2D2926',
    strokeAnimationSpeed: 1, delayBetweenStrokes: 250,
  });

  if (!writer) {
    const hint = document.getElementById('quizStrokeHint');
    if (hint) hint.textContent = 'HanziWriter não carregado.';
    return;
  }

  function playAnimation() {
    const replayBtn = document.getElementById('quizStrokeReplay');
    if (replayBtn) replayBtn.disabled = true;
    animateWriter(writer, {
      onComplete: () => {
        if (replayBtn) replayBtn.disabled = false;
        startDrawing();
      },
    });
  }

  function startDrawing() {
    const hint = document.getElementById('quizStrokeHint');
    if (hint) hint.textContent = 'Agora escreva o caractere traço por traço';
    startWriterQuiz(writer, {
      onMistake: () => {},
      onComplete: summary => {
        state.answered = true;
        if (summary.totalMistakes === 0) state.score++;
        const hint = document.getElementById('quizStrokeHint');
        if (hint) {
          const ok = summary.totalMistakes === 0;
          hint.textContent = ok
            ? 'Perfeito! Nenhum erro.'
            : `Concluído com ${summary.totalMistakes} erro${summary.totalMistakes !== 1 ? 's' : ''}.`;
          hint.className = `quiz-stroke-hint ${ok ? 'quiz-stroke-hint--correct' : 'quiz-stroke-hint--wrong'}`;
        }
        const replayBtn = document.getElementById('quizStrokeReplay');
        if (replayBtn) replayBtn.disabled = true;
        document.getElementById('quizNext').disabled = false;
      },
    });
  }

  document.getElementById('quizStrokeReplay').addEventListener('click', playAnimation);
  document.getElementById('quizNext').addEventListener('click', advance);
  document.getElementById('quizQuit').addEventListener('click', () => {
    const answered = state.answered ? state.current + 1 : state.current;
    renderResult(answered);
  });

  playAnimation();
}

// ── ADVANCE ───────────────────────────────────────────────────────
function advance() {
  if (state.current < state.questions.length - 1) {
    state.current++;
    renderQuestion();
  } else {
    renderResult();
  }
}

// ── RESULT ────────────────────────────────────────────────────────
function renderResult(answeredTotal = state.questions.length) {
  const total = answeredTotal;
  const early = total < state.questions.length;
  const pct   = total > 0 ? Math.round((state.score / total) * 100) : 0;
  const msg   = total === 0 ? 'Quiz encerrado'
    : pct >= 80 ? 'Excelente!' : pct >= 60 ? 'Bom trabalho!' : 'Continue praticando!';
  const unit  = state.mode === 'stroke-order' ? 'perfeitas' : 'corretas';

  container.innerHTML = `
    <div class="quiz-result">
      <div class="quiz-result-pct">${pct}%</div>
      <h2 class="quiz-result-msg">${msg}</h2>
      <p class="quiz-result-detail">${state.score} de ${total} ${unit}${early ? ` <span class="quiz-result-early">(encerrado na ${total + 1}ª pergunta)</span>` : ''}</p>
      <button class="btn-reset" id="quizRestart">Reiniciar quiz</button>
    </div>
  `.trim();

  document.getElementById('quizRestart').addEventListener('click', () => {
    state.mode = null;
    renderModeSelector();
  });
}

// ── INIT ──────────────────────────────────────────────────────────
loadSettings();
renderModeSelector();
