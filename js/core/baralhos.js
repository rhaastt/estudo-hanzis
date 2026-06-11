export function criarBaralho(nome) {
  return { id: `b-${Date.now()}`, nome: nome.trim(), ids: [] };
}

export function toggleItem(baralho, itemId) {
  const idx = baralho.ids.indexOf(itemId);
  if (idx === -1) baralho.ids.push(itemId);
  else baralho.ids.splice(idx, 1);
}

// Remove IDs que não existem mais no catálogo
export function validarIds(baralho, validSet) {
  baralho.ids = baralho.ids.filter(id => validSet.has(id));
}
