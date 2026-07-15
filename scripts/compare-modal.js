/*
 * Compare modal — a shared popup for building a set of up to 3 credit cards
 * to compare. Opened from a card's "Compare" button (pre-adds that card),
 * lets the user add/remove more from a list, and its primary Compare button
 * redirects to the comparison page with the selected fragment paths.
 */

const COMPARE_PAGE = '/compare';
const MAX_CARDS = 3;

let modal;
let selected = [];
let allCards = [];

/* the full pool of comparable cards, provided by the calling block */
function setCardPool(cards) {
  allCards = cards;
}

function redirectToCompare() {
  const paths = selected.map((c) => c.path).filter(Boolean);
  if (!paths.length) return;
  const url = `${COMPARE_PAGE}?paths=${encodeURIComponent(paths.join(','))}`;
  window.location.assign(url);
}

function removeCard(path) {
  selected = selected.filter((c) => c.path !== path);
}

function addCard(card) {
  if (selected.length >= MAX_CARDS) return;
  if (selected.some((c) => c.path === card.path)) return;
  selected.push(card);
}

/* render the selected-slots row + the add-more list */
function renderBody() {
  const slots = modal.querySelector('.compare-modal-slots');
  const pool = modal.querySelector('.compare-modal-pool');
  const compareBtn = modal.querySelector('.compare-modal-submit');

  // slots: up to MAX_CARDS, filled or empty
  slots.textContent = '';
  for (let i = 0; i < MAX_CARDS; i += 1) {
    const card = selected[i];
    const slot = document.createElement('div');
    slot.className = 'compare-modal-slot';
    if (card) {
      slot.classList.add('compare-modal-slot-filled');
      slot.innerHTML = card.image
        ? `<img src="${card.image}" alt="${card.name}" />`
        : '';
      const name = document.createElement('span');
      name.className = 'compare-modal-slot-name';
      name.textContent = card.name;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'compare-modal-slot-remove';
      remove.setAttribute('aria-label', `Remove ${card.name}`);
      remove.textContent = '×';
      remove.addEventListener('click', () => {
        removeCard(card.path);
        renderBody();
      });
      slot.append(name, remove);
    } else {
      slot.innerHTML = '<span class="compare-modal-slot-empty">Add a card</span>';
    }
    slots.append(slot);
  }

  // pool: cards not already selected
  pool.textContent = '';
  const atLimit = selected.length >= MAX_CARDS;
  allCards.forEach((card) => {
    if (selected.some((c) => c.path === card.path)) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'compare-modal-pool-item';
    btn.textContent = card.name;
    btn.disabled = atLimit;
    btn.addEventListener('click', () => {
      addCard(card);
      renderBody();
    });
    pool.append(btn);
  });

  compareBtn.disabled = selected.length < 2;
}

function closeModal() {
  if (modal) modal.hidden = true;
}

function buildModal() {
  modal = document.createElement('div');
  modal.className = 'compare-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="compare-modal-backdrop"></div>
    <div class="compare-modal-dialog" role="dialog" aria-modal="true" aria-label="Compare credit cards">
      <div class="compare-modal-head">
        <h2 class="compare-modal-title">Compare Cards</h2>
        <button type="button" class="compare-modal-close" aria-label="Close">×</button>
      </div>
      <div class="compare-modal-slots"></div>
      <p class="compare-modal-hint">Add up to ${MAX_CARDS} cards to compare.</p>
      <div class="compare-modal-pool"></div>
      <div class="compare-modal-actions">
        <button type="button" class="compare-modal-submit button primary">Compare</button>
      </div>
    </div>`;

  modal.querySelector('.compare-modal-close').addEventListener('click', closeModal);
  modal.querySelector('.compare-modal-backdrop').addEventListener('click', closeModal);
  modal.querySelector('.compare-modal-submit').addEventListener('click', redirectToCompare);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  document.body.append(modal);
}

/**
 * Open the compare modal with one card pre-added.
 * @param {object} card { name, path, image }
 * @param {Array} pool the full list of comparable cards
 */
export default function openCompareModal(card, pool) {
  if (!modal) buildModal();
  if (pool) setCardPool(pool);
  // pre-add the clicked card (avoid duplicates), respecting the max
  if (card && card.path) addCard(card);
  renderBody();
  modal.hidden = false;
}
