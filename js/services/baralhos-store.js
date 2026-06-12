import { hanziList } from '../data/catalog.js';
import { loadBaralhos, saveBaralhos } from './storage.js';
import { criarBaralho, toggleItem as toggleItemPure, validarIds } from '../core/baralhos.js';
import { supabase } from './supabase.js';
import { onAuthChange } from './auth.js';

const validIds = new Set(hanziList.map(h => h.id));

let baralhos = loadBaralhos();
for (const b of baralhos) validarIds(b, validIds);

let currentUserId = null;
const subscribers = new Set();

// ── Persistência ─────────────────────────────────────────────

async function persistir(b) {
  if (!currentUserId) return;
  await supabase.from('baralhos').upsert({
    id:      b.id,
    user_id: currentUserId,
    nome:    b.nome,
    ids:     b.ids,
  });
}

async function removerRemoto(id) {
  if (!currentUserId) return;
  await supabase.from('baralhos').delete().match({ id, user_id: currentUserId });
}

async function carregarDoSupabase() {
  const { data, error } = await supabase
    .from('baralhos')
    .select('id, nome, ids')
    .order('created_at');
  if (error || !data) return;
  baralhos = data.map(row => ({ id: row.id, nome: row.nome, ids: row.ids ?? [] }));
  for (const b of baralhos) validarIds(b, validIds);
  saveBaralhos(baralhos); // mantém cache local sincronizado
  notifyOnly();
}

// ── Auth listener ─────────────────────────────────────────────

onAuthChange(async (session) => {
  currentUserId = session?.user?.id ?? null;
  if (currentUserId) {
    await carregarDoSupabase();
  } else {
    // volta para localStorage ao deslogar
    baralhos = loadBaralhos();
    for (const b of baralhos) validarIds(b, validIds);
    notifyOnly();
  }
});

// ── Notificação interna ───────────────────────────────────────

function notifyOnly() {
  for (const fn of subscribers) fn();
}

function notify(baralhoAlterado) {
  saveBaralhos(baralhos);
  if (baralhoAlterado) persistir(baralhoAlterado);
  notifyOnly();
}

// ── API pública ───────────────────────────────────────────────

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function getBaralhos() { return baralhos; }

export function getBaralho(id) { return baralhos.find(b => b.id === id); }

// null quando o baralho não existe (evita confundir com baralho vazio)
export function deckIds(id) {
  const b = getBaralho(id);
  return b ? b.ids : null;
}

export function addBaralho(nome) {
  const b = criarBaralho(nome);
  baralhos.push(b);
  notify(b);
  return b;
}

export function renameBaralho(id, nome) {
  const b = getBaralho(id);
  if (!b) return;
  b.nome = nome.trim();
  notify(b);
}

export function deleteBaralho(id) {
  removerRemoto(id);
  baralhos = baralhos.filter(b => b.id !== id);
  saveBaralhos(baralhos);
  notifyOnly();
}

export function toggleItem(id, itemId) {
  const b = getBaralho(id);
  if (!b || !validIds.has(itemId)) return;
  toggleItemPure(b, itemId);
  notify(b);
}

export function isLogado() { return currentUserId !== null; }
