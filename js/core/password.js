// Avaliação de força de senha — lógica pura, sem DOM.

export const MIN_PASSWORD_LENGTH = 8;

const LABELS = ['Muito fraca', 'Fraca', 'Média', 'Boa', 'Forte'];

// Retorna { score: 0–4, label, valid } para uma senha.
export function passwordStrength(pw) {
  const senha = pw ?? '';
  let score = 0;

  if (senha.length >= MIN_PASSWORD_LENGTH) score++;
  if (senha.length >= 12) score++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) score++;
  if (/\d/.test(senha)) score++;
  if (/[^A-Za-z0-9]/.test(senha)) score++;

  score = Math.min(score, 4);

  return {
    score,
    label: LABELS[score],
    valid: senha.length >= MIN_PASSWORD_LENGTH,
  };
}
