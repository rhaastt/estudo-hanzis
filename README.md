# Hanzis Essenciais

Aplicação web de estudo de mandarim nível iniciante. Cobre 235 caracteres de vocabulário organizados em categorias gramaticais, 100 países em chinês e 4 modos de quiz interativo — tudo sem dependências de build, direto no navegador.

## Funcionalidades

### Guia de Estudo
Tabela de referência rápida para cada categoria gramatical (pronomes, verbos, advérbios, etc.). Cada linha mostra o hanzi, pinyin colorido por tom, tradução e uma dica mnemônica. Ao final, um resumo visual dos 5 tons do mandarim.

### Flash Cards
Grid de cards interativos com carregamento lazy (lotes de 24). Clique no card para virar e revelar pinyin, tradução e exemplo de frase.

- Filtro por nível HSK (HSK 1–4 + Sem HSK) e por categoria
- Cor do hanzi e da stroke seguem o nível HSK do caractere
- Badge do nível HSK no canto superior direito (frente e verso)
- Caracteres únicos exibem animação de traços via **HanziWriter**
- Barra de progresso mostrando quantos cards foram virados
- Botão "Reiniciar todos os cards"

### Quiz — 4 modos

| Modo | Pergunta | Resposta |
| --- | --- | --- |
| Hanzi → Tradução | Vê o caractere | Escolhe o significado entre 4 opções |
| Tradução → Hanzi | Vê o significado | Escolhe o caractere correto |
| Pinyin → Hanzi | Vê o pinyin | Escolhe o caractere correto |
| Escrita de Traços | Vê pinyin + tradução | Observa a animação e desenha o caractere traço a traço |

**Configurações persistidas no localStorage:**
- Seleção de categoria (multi-seleção com pills)
- Quantidade de perguntas (5 / 10 / 20 / Todos)

**Comportamento dos cards de resposta:** ao escolher, todos os 4 cards viram e revelam hanzi, pinyin e tradução do item correspondente. Verde + ✓ = correto, vermelho + ✗ = errado. Cor do hanzi segue o nível HSK do item.

**Tela de resultado:** anel SVG com a porcentagem, chips de corretas/erradas e botão "Tentar novamente" (reutiliza as configurações atuais).

**Módulo de Escrita de Traços:** usa a biblioteca HanziWriter em modo quiz — a animação dos traços é exibida automaticamente, depois o usuário deve redesenhar cada traço na ordem correta. Score conta apenas completações sem nenhum erro.

### Países
100 países como flip cards: frente mostra a bandeira + nome em português, verso mostra o hanzi, pinyin e nome. Clicar vira o card.

Os países também estão disponíveis como categoria no Quiz.

## Estrutura de Arquivos

```
estudo-hanzis/
├── index.html
├── css/
│   ├── base.css           # variáveis, reset, mecanismo flip-card compartilhado
│   ├── layout.css         # header, tabs, navegação
│   ├── flashcards.css     # grid, cards, cores HSK
│   ├── quiz.css           # tela de quiz, opções, resultado
│   ├── guide.css          # tabela de referência
│   ├── paises.css         # seção de países
│   ├── modals.css         # modal de traços
│   └── responsive.css     # breakpoints mobile
├── js/
│   ├── app.js             # inicialização, flash cards, lazy load, filtros HSK
│   ├── quiz.js            # módulo de quiz completo (4 modos)
│   ├── render.js          # funções de criação de DOM (guia, flash cards)
│   ├── core/
│   │   ├── flip-card.js   # factory de flip card reutilizável
│   │   ├── hsk-colors.js  # cores e níveis HSK compartilhados
│   │   ├── quiz-engine.js # lógica de geração de perguntas
│   │   ├── quiz-state.js  # estado global do quiz
│   │   ├── search.js      # busca global
│   │   └── vocabulary.js  # utilitários de acesso ao schema de dados
│   ├── data/
│   │   ├── catalog.js     # hanziList (vocabulário + países) com validação
│   │   ├── vocabulary.js  # 235 itens de vocabulário
│   │   ├── categories.js  # definição das categorias gramaticais
│   │   └── countries.js   # 100 países
│   └── services/
│       ├── hanzi-writer.js # wrapper do HanziWriter
│       └── storage.js      # persistência no localStorage
└── tests/
    ├── catalog.test.js
    ├── quiz-engine.test.js
    ├── search.test.js
    └── vocabulary.test.js
```

## Tecnologias

- HTML + CSS + JavaScript puro — sem framework, sem build step
- ES Modules nativos (`import`/`export`)
- [HanziWriter 3.5](https://hanziwriter.org) — animação e quiz de traços (CDN)
- Bandeiras via CDN `hampusborgos/country-flags` (SVG)
- Fontes: DM Serif Display + DM Sans (Google Fonts)
- IntersectionObserver para lazy loading dos flash cards

## Como Rodar

Qualquer servidor HTTP estático serve. Exemplos:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# VS Code
# instale a extensão Live Server e clique em "Go Live"
```

Abra `http://localhost:8080` no navegador.

> Não funciona via `file://` por causa dos ES Modules — precisa de um servidor HTTP.

## Testes

```bash
node --test 'tests/**/*.test.js'
```

Cobre validação do catálogo, motor de quiz, busca e utilitários de vocabulário.

## Dados

**`js/data/vocabulary.js`** — 235 itens de vocabulário com os campos:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único |
| `hanzi` | string | Caractere(s) chinês(es) |
| `pinyin` | string | Romanização com diacríticos de tom |
| `tones` | number[] | Tons por sílaba (0 = neutro) |
| `category` | string | ID da categoria |
| `hsk` | 1–6 \| null | Nível HSK (null = fora do padrão HSK) |
| `labels.pt.category` | string | Rótulo legível da categoria |
| `translations.pt.primary` | string | Tradução completa em português |
| `translations.pt.short` | string | Tradução curta (usada no quiz) |
| `translations.pt.mnemonic` | string? | Dica mnemônica |
| `examples` | array | Exemplos `{ zh, translations: { pt } }` |

**`js/data/countries.js`** — 100 países com os campos `id`, `name`, `hanzi`, `pinyin`, `flag`.
