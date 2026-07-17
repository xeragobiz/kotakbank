/*
 * Back Link — a small "← Label" control that returns the user to the previous
 * page in browser history. Authors set the label (e.g. "Credit Cards"); it is
 * typically placed at the top of the apply page.
 */

export default function decorate(block) {
  const label = block.textContent.trim() || 'Back';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'back-link-button';
  btn.innerHTML = `<span class="back-link-icon" aria-hidden="true"></span><span class="back-link-label">${label}</span>`;

  btn.addEventListener('click', () => {
    window.history.back();
  });

  block.replaceChildren(btn);
}
