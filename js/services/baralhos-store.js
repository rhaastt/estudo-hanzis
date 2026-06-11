import { hanziList } from '../data/catalog.js';
import { loadBaralhos, saveBaralhos } from './storage.js';
import { criarBaralho, toggleItem as toggleItemPure, validarIds } from '../core/baralhos.js';

const validIds = new Set(hanziList.map(h => h.id));

// Fonte única da verdade — singleton compartilhado entre app.js e quiz.js
let baralhos = loadBaralhos();
for (const b of baralhos) validarIds(b, validIds);

const subscribers = new Set();

function notify() {
  saveBaralhos(baralhos);
  for (const fn of subscribers) fn();
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function getBaralhos() {
  return baralhos;
}

export function getBaralho(id) {
  return baralhos.find(b => b.id === id);
}

// ids do baralho, ou null se o baralho não existe (evita confundir com baralho vazio)
export function deckIds(id) {
  const b = getBaralho(id);
  return b ? b.ids : null;
}

export function addBaralho(nome) {
  const b = criarBaralho(nome);
  baralhos.push(b);
  notify();
  return b;
}

export function renameBaralho(id, nome) {
  const b = getBaralho(id);
  if (!b) return;
  b.nome = nome.trim();
  notify();
}

export function deleteBaralho(id) {
  baralhos = baralhos.filter(b => b.id !== id);
  notify();
}

export function toggleItem(id, itemId) {
  const b = getBaralho(id);
  if (!b || !validIds.has(itemId)) return;
  toggleItemPure(b, itemId);
  notify();
}
