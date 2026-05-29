export function createStrokeWriter(element, character, options) {
  if (typeof HanziWriter === 'undefined') return null;
  return HanziWriter.create(element, character, options);
}

export function animateWriter(writer, callbacks = {}) {
  if (!writer) return;
  writer.animateCharacter(callbacks);
}

export function startWriterQuiz(writer, callbacks = {}) {
  if (!writer) return;
  writer.hideCharacter();
  writer.quiz(callbacks);
}
