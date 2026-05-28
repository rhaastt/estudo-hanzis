// tone → CSS class for pinyin (tone-5 = neutral)
const PINYIN_CLASS = ['tone-5', 'tone-1', 'tone-2', 'tone-3', 'tone-4'];
// tone → CSS class for tone-block badge
const BLOCK_CLASS  = ['tn', 't1', 't2', 't3', 't4'];
// tone → display label inside badge
const BLOCK_LABEL  = ['neutro', '1º', '2º', '3º', '4º'];

export function createGuideGroup(category, items) {
  const group = document.createElement('div');
  group.className = 'group';
  group.dataset.cat = category.id;

  const header = document.createElement('div');
  header.className = 'group-header';
  header.innerHTML = `
    <div class="group-dot"></div>
    <div class="group-title">${category.guideTitle}</div>
    <div class="group-count">${items.length} ${items.length === 1 ? 'caractere' : 'caracteres'}</div>
  `.trim();
  group.appendChild(header);

  if (category.guideTip) {
    const tip = document.createElement('div');
    tip.className = 'group-tip';
    tip.innerHTML = category.guideTip;
    group.appendChild(tip);
  }

  const table = document.createElement('table');
  table.className = 'hanzi-table';

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>
    <th>Hanzi</th><th>Pinyin</th><th>Tom</th>
    <th>Tradução</th><th>${category.guideLastCol ?? 'Nota'}</th>
  </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const item of items) {
    const pClass = PINYIN_CLASS[item.tone] ?? 'tone-5';
    const bClass = BLOCK_CLASS[item.tone]  ?? 'tn';
    const bLabel = BLOCK_LABEL[item.tone]  ?? 'neutro';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="hanzi-char">${item.hanzi}</span></td>
      <td><span class="pinyin ${pClass}">${item.pinyin}</span></td>
      <td><span class="tone-block ${bClass}">${bLabel}</span></td>
      <td class="translation">${item.translation}</td>
      <td class="mnemonic">${item.mnemonic ?? ''}</td>
    `.trim();
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  group.appendChild(table);

  return group;
}

export function createFlashCard(item) {
  const card = document.createElement('div');
  card.className = `fc-item cat-${item.category}`;
  card.dataset.id  = item.id;
  card.dataset.cat = item.category;

  const translation = item.fcTranslation ?? item.translation;
  const ex  = item.examples[0] ?? { zh: '', pt: '' };
  const exText = ex.pt ? `${ex.zh} ${ex.pt}` : ex.zh;

  card.innerHTML = `
    <div class="fc-inner">
      <div class="fc-front">
        <div class="fc-hanzi">${item.hanzi}</div>
        <div class="fc-hint">clique para revelar</div>
      </div>
      <div class="fc-back">
        <div class="fc-pinyin">${item.pinyin}</div>
        <div class="fc-translation">${translation}</div>
        <div class="fc-category-tag">${item.categoryLabel}</div>
        <div class="fc-example">${exText}</div>
      </div>
    </div>
  `.trim();

  return card;
}

export function createFilterButton(category, isActive) {
  const btn = document.createElement('button');
  btn.className = 'filter-btn' + (isActive ? ' active' : '');
  btn.dataset.cat = category.id;
  btn.textContent = category.label;
  return btn;
}

export function createToneSummary() {
  const group = document.createElement('div');
  group.className = 'group';
  group.dataset.cat = 'tone-summary';
  group.innerHTML = `
    <div class="group-header">
      <div class="group-dot"></div>
      <div class="group-title">Resumo dos Tons</div>
      <div class="group-count">referência rápida</div>
    </div>
    <div class="tone-summary-grid">
      <div class="tone-card">
        <span class="tone-block t1">1º tom — ā</span>
        <p class="tone-card-desc">Plano e alto. Segure a nota como um cantor de ópera: <strong>ā</strong></p>
        <p class="tone-card-example">dōu · tā · shuō</p>
      </div>
      <div class="tone-card">
        <span class="tone-block t2">2º tom — á</span>
        <p class="tone-card-desc">Sobe como uma pergunta em português: <strong>á?</strong></p>
        <p class="tone-card-example">hái · míng · guó · wén · hé · shén · nín</p>
      </div>
      <div class="tone-card">
        <span class="tone-block t3">3º tom — ǎ</span>
        <p class="tone-card-desc">Desce e sobe — como "hm?" duvidando: <strong>ǎ</strong></p>
        <p class="tone-card-example">wǒ · nǐ · zhǐ · yǔ · nǎ · yě</p>
      </div>
      <div class="tone-card">
        <span class="tone-block t4">4º tom — à</span>
        <p class="tone-card-desc">Cai forte, como uma ordem: <strong>à!</strong></p>
        <p class="tone-card-example">shì · jiào · bù · xìng · zì · guì</p>
      </div>
      <div class="tone-card">
        <span class="tone-block tn">Tom neutro</span>
        <p class="tone-card-desc">Curto e sem ênfase, quase inaudível</p>
        <p class="tone-card-example">men · ma · ne · me</p>
      </div>
    </div>
  `.trim();
  return group;
}
