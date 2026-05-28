import { categories, hanziList } from './data.js';

const container = document.getElementById('quizContainer');

const state = {
  mode: null,
  questions: [],
  current: 0,
  score: 0,
  answered: false,
  category: 'all',
  count: 10,
};

const COUNT_OPTIONS = [5, 10, 20, 'all'];
const COUNT_LABELS  = { 5: '5', 10: '10', 20: '20', all: 'Todos' };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(mode) {
  let pool = state.category === 'all'
    ? [...hanziList]
    : hanziList.filter(h => h.category === state.category);

  pool = shuffle(pool);
  if (state.count !== 'all') pool = pool.slice(0, state.count);

  return pool.map(item => {
    let questionText, qClass, qSub, getVal, optClass;

    if (mode === 'hanzi-to-trans') {
      questionText = item.hanzi;
      qClass      = 'quiz-q-hanzi';
      qSub        = '';
      getVal      = h => h.fcTranslation ?? h.translation;
      optClass    = '';
    } else if (mode === 'trans-to-hanzi') {
      questionText = item.fcTranslation ?? item.translation;
      qClass      = '';
      qSub        = '';
      getVal      = h => h.hanzi;
      optClass    = 'quiz-opt-hanzi';
    } else {
      // pinyin-to-hanzi: show translation as context to avoid tā ambiguity (他/她)
      questionText = item.pinyin;
      qClass      = 'quiz-q-pinyin';
      qSub        = item.fcTranslation ?? item.translation;
      getVal      = h => h.hanzi;
      optClass    = 'quiz-opt-hanzi';
    }

    const correctAnswer = getVal(item);
    const wrongPool     = shuffle(hanziList.filter(h => h.id !== item.id && getVal(h) !== correctAnswer));
    const options       = shuffle([correctAnswer, ...wrongPool.slice(0, 3).map(getVal)]);

    return { questionText, qClass, qSub, options, optClass, correctIndex: options.indexOf(correctAnswer) };
  });
}

// ── MODE SELECTOR ────────────────────────────────────────────────
function renderModeSelector() {
  container.innerHTML = `
    <div class="quiz-modes">
      <h2 class="quiz-modes-title">Escolha o modo</h2>

      <div class="quiz-settings">
        <div class="quiz-settings-row">
          <span class="quiz-settings-label">Categoria</span>
          <select class="quiz-cat-select" id="quizCatSelect">
            ${categories.map(c => `<option value="${c.id}"${c.id === state.category ? ' selected' : ''}>${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="quiz-settings-row">
          <span class="quiz-settings-label">Perguntas</span>
          <div class="quiz-count-btns">
            ${COUNT_OPTIONS.map(n => `<button class="quiz-count-btn${n === state.count ? ' active' : ''}" data-count="${n}">${COUNT_LABELS[n]}</button>`).join('')}
          </div>
        </div>
      </div>

      <div class="quiz-modes-grid">
        <button class="quiz-mode-card" data-mode="hanzi-to-trans">
          <div class="quiz-mode-glyph">汉</div>
          <div class="quiz-mode-name">Hanzi → Tradução</div>
          <div class="quiz-mode-hint">Veja o caractere, escolha o significado</div>
        </button>
        <button class="quiz-mode-card" data-mode="trans-to-hanzi">
          <div class="quiz-mode-glyph">文</div>
          <div class="quiz-mode-name">Tradução → Hanzi</div>
          <div class="quiz-mode-hint">Veja o significado, escolha o caractere</div>
        </button>
        <button class="quiz-mode-card" data-mode="pinyin-to-hanzi">
          <div class="quiz-mode-glyph quiz-mode-glyph--pinyin">pīn</div>
          <div class="quiz-mode-name">Pinyin → Hanzi</div>
          <div class="quiz-mode-hint">Veja o pinyin, escolha o caractere</div>
        </button>
      </div>
    </div>
  `.trim();

  document.getElementById('quizCatSelect').addEventListener('change', e => {
    state.category = e.target.value;
  });

  container.querySelectorAll('.quiz-count-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const val = btn.dataset.count;
      state.count = val === 'all' ? 'all' : +val;
      container.querySelectorAll('.quiz-count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    })
  );

  container.querySelectorAll('.quiz-mode-card').forEach(btn =>
    btn.addEventListener('click', () => startQuiz(btn.dataset.mode))
  );
}

// ── QUESTION ─────────────────────────────────────────────────────
function startQuiz(mode) {
  state.mode      = mode;
  state.questions = buildQuestions(mode);
  state.current   = 0;
  state.score     = 0;
  state.answered  = false;
  renderQuestion();
}

function renderQuestion() {
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
        ${q.options.map((opt, i) => `
          <button class="quiz-opt ${q.optClass}" data-idx="${i}">${opt}</button>
        `).join('')}
      </div>
      <div class="quiz-foot">
        <button class="quiz-next" id="quizNext" disabled>
          ${state.current < total - 1 ? 'Próxima' : 'Ver resultado'}
        </button>
      </div>
    </div>
  `.trim();

  container.querySelectorAll('.quiz-opt').forEach(btn =>
    btn.addEventListener('click', () => handleAnswer(+btn.dataset.idx))
  );
  document.getElementById('quizNext').addEventListener('click', advance);
}

function handleAnswer(idx) {
  if (state.answered) return;
  state.answered = true;

  const q = state.questions[state.current];
  if (idx === q.correctIndex) state.score++;

  container.querySelectorAll('.quiz-opt').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correctIndex)                  btn.classList.add('quiz-opt-correct');
    if (i === idx && idx !== q.correctIndex)   btn.classList.add('quiz-opt-wrong');
  });

  document.getElementById('quizNext').disabled = false;
}

function advance() {
  if (state.current < state.questions.length - 1) {
    state.current++;
    renderQuestion();
  } else {
    renderResult();
  }
}

// ── RESULT ───────────────────────────────────────────────────────
function renderResult() {
  const total = state.questions.length;
  const pct   = Math.round((state.score / total) * 100);
  const msg   = pct >= 80 ? 'Excelente!' : pct >= 60 ? 'Bom trabalho!' : 'Continue praticando!';

  container.innerHTML = `
    <div class="quiz-result">
      <div class="quiz-result-pct">${pct}%</div>
      <h2 class="quiz-result-msg">${msg}</h2>
      <p class="quiz-result-detail">${state.score} de ${total} corretas</p>
      <button class="btn-reset" id="quizRestart">Reiniciar quiz</button>
    </div>
  `.trim();

  document.getElementById('quizRestart').addEventListener('click', () => {
    state.mode = null;
    renderModeSelector();
  });
}

renderModeSelector();
