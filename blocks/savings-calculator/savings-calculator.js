import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Savings Calculator — spend sliders that estimate monthly savings and
 * surface the best-match Kotak card. Calculation is hardcoded; categories,
 * cards, and cashback rates are authorable. Client-side only.
 *
 * Model children:
 *  - Spend Category: cat_label, cat_icon, cat_default, cat_range(min,max,step)
 *  - Calculator Card: card_name, card_meta("badge|fee"),
 *      card_rates(csv % per category), applyLink(+text)
 *
 * Item rows are classified by their data-aue-model first (so empty/new items
 * added in Universal Editor are still recognized), falling back to content
 * heuristics for the published context. Each category's instrumentation is
 * moved onto its slider field, and each card gets one always-present
 * instrumented node (reused across slider updates) so no child item
 * disappears from the editor.
 * @param {Element} block the block element
 */
const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

export default function decorate(block) {
  const rows = [...block.children];

  const categories = [];
  const cards = [];
  const chrome = [];
  rows.forEach((r) => {
    const model = r.getAttribute('data-aue-model') || '';
    const cells = [...r.children].map((c) => c.querySelector(':scope > div') || c);
    const joined = cells.map((c) => c.textContent.trim());
    const hasLink = cells.some((c) => c.querySelector('a'));
    const hasRange = cells.some((c) => /^\s*\d+\s*,\s*\d+\s*,\s*\d+/.test(c.textContent));
    const isCard = model === 'savings-calculator-card' || (!model && hasLink);
    const isCategory = model === 'savings-calculator-category' || (!model && hasRange);

    if (isCard) {
      const link = cells.find((c) => c.querySelector('a'))?.querySelector('a');
      const [name, meta, rates] = joined.filter((t) => t && !/^https?:/.test(t));
      const [badge, fee] = (meta || '').split('|').map((s) => s.trim());
      cards.push({
        row: r,
        name: name || '',
        badge: badge || '',
        fee: fee || '',
        rates: (rates || '').split(',').map((n) => parseFloat(n) || 0),
        href: link ? link.getAttribute('href') : '#',
        applyText: link ? link.textContent.trim() : 'Apply Now',
      });
    } else if (isCategory) {
      const rangeCell = cells.find((c) => /\d+\s*,\s*\d+\s*,\s*\d+/.test(c.textContent));
      let min = 0;
      let max = 30000;
      let step = 500;
      if (rangeCell) {
        const parts = rangeCell.textContent.split(',').map((n) => parseInt(n.trim(), 10));
        [min, max, step] = [
          Number.isFinite(parts[0]) ? parts[0] : 0,
          Number.isFinite(parts[1]) ? parts[1] : 30000,
          Number.isFinite(parts[2]) ? parts[2] : 500,
        ];
      }
      const numCell = cells.find((c) => c !== rangeCell && /^\s*\d+\s*$/.test(c.textContent));
      const textCells = cells.filter((c) => c !== rangeCell && c !== numCell
        && c.textContent.trim());
      let label = '';
      let icon = '';
      textCells.forEach((c) => {
        const t = c.textContent.trim();
        if ([...t].length <= 3) icon = t; else label = t;
      });
      categories.push({
        row: r,
        label,
        icon,
        def: numCell ? parseInt(numCell.textContent.trim(), 10) : min,
        min,
        max,
        step: step || 500,
      });
    } else if (joined.some(Boolean)) {
      chrome.push(joined.filter(Boolean)[0]);
    }
  });

  const [eyebrow, heading, subtitle] = chrome;

  const wrapper = document.createElement('div');
  wrapper.className = 'savings-calculator-inner';

  const head = document.createElement('div');
  head.className = 'savings-calculator-head';
  if (eyebrow) {
    const e = document.createElement('p');
    e.className = 'savings-calculator-eyebrow';
    e.textContent = eyebrow;
    head.append(e);
  }
  if (heading) {
    const h = document.createElement('h2');
    h.className = 'savings-calculator-title';
    h.textContent = heading;
    head.append(h);
  }
  if (subtitle) {
    const p = document.createElement('p');
    p.className = 'savings-calculator-subtitle';
    p.textContent = subtitle;
    head.append(p);
  }
  wrapper.append(head);

  const grid = document.createElement('div');
  grid.className = 'savings-calculator-grid';

  // ---- left: spending panel ----
  const spend = document.createElement('div');
  spend.className = 'savings-calculator-spend';
  const spendHead = document.createElement('div');
  spendHead.className = 'savings-calculator-spend-head';
  const spendTitle = document.createElement('span');
  spendTitle.textContent = 'Your monthly spending';
  const spendTotal = document.createElement('span');
  spendTotal.className = 'savings-calculator-total';
  spendHead.append(spendTitle, spendTotal);
  spend.append(spendHead);

  const state = categories.map((c) => c.def);

  categories.forEach((cat, i) => {
    const field = document.createElement('div');
    field.className = 'savings-calculator-field';
    // keep the category child editable in Universal Editor
    moveInstrumentation(cat.row, field);

    const label = document.createElement('div');
    label.className = 'savings-calculator-field-label';
    label.textContent = `${cat.icon} ${cat.label}`.trim();

    const value = document.createElement('span');
    value.className = 'savings-calculator-field-value';

    const row = document.createElement('div');
    row.className = 'savings-calculator-field-row';
    row.append(label, value);
    field.append(row);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = cat.min;
    input.max = cat.max;
    input.step = cat.step;
    input.value = cat.def;
    input.className = 'savings-calculator-slider';
    input.setAttribute('aria-label', cat.label);
    field.append(input);

    input.addEventListener('input', () => {
      state[i] = parseInt(input.value, 10);
      // eslint-disable-next-line no-use-before-define
      update();
    });

    field.dataset.index = i;
    field.valueEl = value;
    spend.append(field);
  });

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'savings-calculator-reset';
  reset.textContent = 'Reset';
  reset.addEventListener('click', () => {
    categories.forEach((c, i) => {
      state[i] = c.def;
      const inp = spend.querySelectorAll('.savings-calculator-slider')[i];
      if (inp) inp.value = c.def;
    });
    // eslint-disable-next-line no-use-before-define
    update();
  });
  spendHead.append(reset);

  grid.append(spend);

  // ---- right: result panel ----
  const result = document.createElement('div');
  result.className = 'savings-calculator-result';
  grid.append(result);

  wrapper.append(grid);

  // one persistent, instrumented node per authored card. These are reused
  // (re-appended + re-filled) on every slider update so a card never loses
  // its data-aue-* and never disappears from the editor.
  cards.forEach((card) => {
    const el = document.createElement('div');
    moveInstrumentation(card.row, el);
    card.el = el;
  });

  // compute monthly savings for a card given current spend state
  const cardSavings = (card) => state.reduce((sum, spendVal, i) => {
    const rate = (card.rates[i] || 0) / 100;
    return sum + spendVal * rate;
  }, 0);

  function update() {
    const total = state.reduce((a, b) => a + b, 0);
    spendTotal.textContent = `${inr(total)}/mo`;

    const ranked = [...cards].sort((a, b) => cardSavings(b) - cardSavings(a));
    const best = ranked[0];

    // per-field value + best card's per-category savings
    spend.querySelectorAll('.savings-calculator-field').forEach((field) => {
      const i = parseInt(field.dataset.index, 10);
      const rate = best ? (best.rates[i] || 0) / 100 : 0;
      const saved = state[i] * rate;
      field.valueEl.innerHTML = `${inr(state[i])} <span class="savings-calculator-saved">Save ${inr(saved)}</span>`;
    });

    // rebuild result layout while REUSING the persistent card nodes
    result.replaceChildren();
    if (!best) return;

    const monthly = cardSavings(best);
    best.el.className = 'savings-calculator-best';
    best.el.innerHTML = `
      <p class="savings-calculator-best-flag">Best match for you</p>
      <h3 class="savings-calculator-best-name">${best.name}</h3>
      ${best.badge ? `<span class="savings-calculator-best-badge">${best.badge}</span>` : ''}
      <p class="savings-calculator-best-amount">${inr(monthly)}</p>
      <p class="savings-calculator-best-note">estimated savings/month · ${inr(monthly * 12)} per year</p>
    `;
    const applyA = document.createElement('a');
    applyA.href = best.href;
    applyA.className = 'savings-calculator-apply';
    applyA.textContent = best.applyText || `Apply for ${best.name}`;
    best.el.append(applyA);
    result.append(best.el);

    const others = ranked.slice(1);
    if (others.length) {
      const oh = document.createElement('p');
      oh.className = 'savings-calculator-others-title';
      oh.textContent = 'Other Recommended Cards';
      result.append(oh);
      const list = document.createElement('div');
      list.className = 'savings-calculator-others';
      others.forEach((c) => {
        const m = cardSavings(c);
        c.el.className = 'savings-calculator-other';
        c.el.innerHTML = `
          <span class="savings-calculator-other-name">${c.name}</span>
          <span class="savings-calculator-other-amount">${inr(m)}</span>
          <span class="savings-calculator-other-note">estimated savings/month</span>
        `;
        list.append(c.el);
      });
      result.append(list);
    }
  }

  update();

  block.textContent = '';
  block.append(wrapper);
}
