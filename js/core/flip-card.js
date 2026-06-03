export function createFlipCard({ front, back, classes = '' }) {
  const el = document.createElement('div');
  el.className = `flip-card ${classes}`.trim();
  el.innerHTML = `
    <div class="flip-inner">
      <div class="flip-front">${front}</div>
      <div class="flip-back">${back}</div>
    </div>`.trim();
  return el;
}
