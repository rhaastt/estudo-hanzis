# AGENTS.md — Guia para agentes de IA

Referência operacional para agentes trabalhando neste repositório.
Para uma visão orientada ao usuário, veja `README.md`.

---

## Visão geral

App web de estudo de mandarim: flash cards, guia de referência, quiz (4 modos) e seção de países.
**Vanilla HTML + CSS + JavaScript.** Sem framework, sem build step, sem transpiler. ES Modules nativos.

---

## Comandos

```bash
# Servidor de desenvolvimento (necessário — ES Modules não funcionam via file://)
python3 -m http.server 8080
# ou: npx serve .

# Testes
node --test 'tests/**/*.test.js'
```

Sempre rodar os testes antes de finalizar mudanças em `js/core/` ou `js/data/`.

---

## Arquitetura de arquivos

```
js/
├── app.js              # ponto de entrada: flash cards, lazy load, filtros HSK
├── quiz.js             # quiz completo (4 modos), gerencia estado e DOM
├── render.js           # factories de DOM: createFlashCard, createGuideGroup, etc.
├── core/               # lógica pura, sem efeitos colaterais de DOM
│   ├── flip-card.js    # factory createFlipCard({ front, back, classes })
│   ├── hsk-colors.js   # hskColor(level) → string de cor
│   ├── hsk.js          # HSK_FILTER_OPTIONS (para filtros de UI)
│   ├── quiz-engine.js  # geração de perguntas e opções
│   ├── quiz-state.js   # estado global do quiz (state, COUNT_OPTIONS)
│   ├── search.js       # busca global (searchItems)
│   └── vocabulary.js   # helpers de acesso ao schema de dados
├── data/               # dados estáticos + validação
│   ├── catalog.js      # hanziList = vocabulário + países; valida schema
│   ├── vocabulary.js   # 235 itens de vocabulário
│   ├── categories.js   # definição das categorias gramaticais
│   └── countries.js    # 100 países
└── services/
    ├── hanzi-writer.js # wrapper do HanziWriter (CDN)
    └── storage.js      # persistência no localStorage
css/
├── base.css            # variáveis CSS, reset, mecanismo flip-card compartilhado
├── layout.css          # header, tabs, navegação
├── flashcards.css      # grid, cards, badges HSK
├── quiz.css            # tela de quiz, opções, resultado
├── guide.css           # tabela de referência
├── paises.css          # seção de países
├── modals.css          # modal de traços (HanziWriter)
└── responsive.css      # breakpoints mobile
tests/
├── catalog.test.js
├── quiz-engine.test.js
├── search.test.js
└── vocabulary.test.js
```

### Separação de responsabilidades

| Camada | Regra |
|--------|-------|
| `core/` | Lógica pura, zero DOM, zero `import` de `data/` (exceto tipos) |
| `data/` | Dados e validação de schema; não importa de `core/` |
| `services/` | Wrappers de APIs externas (HanziWriter, localStorage) |
| `render.js` / `app.js` / `quiz.js` | Únicos que tocam DOM diretamente |

---

## Schema de dados do vocabulário

```js
{
  id: 'wo',                         // string, identificador único
  hanzi: '我',                       // string
  pinyin: 'wǒ',                     // string com diacríticos de tom
  tones: [3],                       // number[] — 0 = tom neutro
  category: 'pronouns',             // string, ID da categoria
  hsk: 1,                           // 1–6 | null (null = fora do HSK padrão)
  labels: { pt: { category: 'Pronome' } },
  translations: {
    pt: {
      primary: 'eu, me, mim',       // tradução completa
      short:   'eu',                // tradução curta (quiz)
      mnemonic: '...',              // string | undefined
    }
  },
  examples: [
    { zh: '我是学生', translations: { pt: 'Eu sou estudante' } }
  ]
}
```

**Sempre use os helpers de `js/core/vocabulary.js`** em vez de acessar campos crus:

```js
import {
  primaryTranslation, shortTranslation, mnemonic,
  categoryLabel, firstTone, exampleTranslation, formatMnemonic,
} from './core/vocabulary.js';
```

---

## Sistema HSK

- Níveis 1–4 e `null` (sem nível).
- Cor por nível: `hskColor(level)` de `js/core/hsk-colors.js`.
- Flash cards: cor do hanzi e da stroke seguem `item.hsk`; badge HSK no canto superior direito.
- **Quiz: cards de opção NÃO usam cores HSK** — visual neutro intencional.

---

## Convenções de código

- **ES Modules nativos** — todo `import` precisa de extensão `.js`; sem barrel files anônimos.
- **Sem build**: não introduzir TypeScript, bundlers ou transpilers.
- **CSS por feature**: cada seção tem seu próprio arquivo em `css/`; não adicionar estilos inline no JS quando uma classe CSS resolve.
- **Flip card compartilhado**: mecânica `.flip-card / .flip-inner / .flip-front / .flip-back` definida em `base.css`; criar instâncias via `createFlipCard()`.
- **Schema**: ao adicionar campos ao vocabulário, atualizar a validação em `js/data/catalog.js` e os helpers em `js/core/vocabulary.js`.
- **Sem comentários redundantes**: comentar apenas o "por quê" não óbvio.

---

## Do / Don't

| ✅ Fazer | ❌ Não fazer |
|----------|-------------|
| Rodar `node --test` após mudanças em `core/` ou `data/` | Acessar `item.translation`, `item.tone` (campos do schema antigo) |
| Usar classes CSS para variações visuais | Estilos inline no JS |
| Usar `createFlipCard()` para qualquer flip card | Duplicar HTML/CSS do mecanismo de flip |
| Usar `hskColor()` para cores de hanzi/stroke | Hardcodar cores HSK espalhadas no código |
| Servir com HTTP (`python3 -m http.server`) | Abrir `index.html` direto via `file://` |
| Manter dados validados em `catalog.js` | Adicionar itens de vocabulário sem validação de schema |
