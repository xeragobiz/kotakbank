import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { loadCreditCard, cardReferencePath, isCardReference } from '../../scripts/credit-card.js';

/**
 * Savings Calculator — spend sliders that surface the best-match Kotak card.
 * Recommended cards come from Credit Card content fragments (referenced items);
 * the "best match" is the card whose filter tag matches the highest-spend
 * category. Client-side only.
 *
 * Model children:
 *  - Spend Category: cat_icon(image), cat_iconAlt, cat_label, cat_default,
 *      cat_range(min,max,step), cat_tag(card filter tag this spend maps to)
 *  - Calculator Card (Reference): cardRef (aem-content → Credit Card fragment)
 *
 * Item rows are classified by data-aue-model (so empty/new items stay
 * recognized in Universal Editor); each keeps its instrumentation via
 * moveInstrumentation and card nodes are reused across slider updates.
 * @param {Element} block the block element
 */
const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

// prefixed fields collapse into one cell as sibling <p>/<picture>; read the
// item's flattened image + ordered non-empty text values.
function flatten(r) {
  const img = r.querySelector('img');
  let texts = [...r.querySelectorAll('p')].map((p) => p.textContent.trim()).filter(Boolean);
  if (!texts.length) {
    texts = [...r.children]
      .map((c) => (c.querySelector(':scope > div') || c).textContent.trim())
      .filter(Boolean);
  }
  return { img, texts };
}

export default async function decorate(block) {
  const rows = [...block.children];

  const rawCategories = [];
  const refRows = [];
  const chrome = [];
  rows.forEach((r) => {
    const model = r.getAttribute('data-aue-model') || '';
    if (model === 'savings-calculator-ref' || isCardReference(r)) {
      refRows.push(r);
      return;
    }
    const { img, texts } = flatten(r);
    const hasRange = texts.some((t) => /^\s*\d+\s*,\s*\d+/.test(t));
    const isCategory = model === 'savings-calculator-category' || (hasRange || !!img);
    if (isCategory) {
      rawCategories.push({ row: r, img, texts });
    } else if (texts.length) {
      chrome.push(texts[0]);
    }
  });

  const [eyebrow, heading, subtitle] = chrome;

  // load referenced Credit Card fragments (name, badge, image, apply, tags)
  const cards = (await Promise.all(refRows.map(async (row) => {
    const data = isCardReference(row) ? await loadCreditCard(cardReferencePath(row)) : null;
    return { row, data: data || {} };
  })));
  const knownTags = new Set(
    cards.flatMap((c) => (c.data.tags || '').split(',').map((t) => t.trim().toLowerCase())).filter(Boolean),
  );

  // finalize categories now that we know the card tag vocabulary
  const categories = rawCategories.map(({ row, img, texts }) => {
    const rangeText = texts.find((t) => /^\s*\d+\s*,\s*\d+/.test(t)) || '';
    const parts = rangeText.split(',').map((n) => parseInt(n.trim(), 10));
    const min = Number.isFinite(parts[0]) ? parts[0] : 0;
    const max = Number.isFinite(parts[1]) ? parts[1] : 30000;
    const step = Number.isFinite(parts[2]) ? parts[2] : 500;
    const defText = texts.find((t) => /^\s*\d+\s*$/.test(t));
    const nonNums = texts.filter((t) => !/^\s*[\d,]+\s*$/.test(t));
    // tag = the non-numeric text exactly matching a known card tag; label = the
    // last remaining non-numeric text (field order is iconAlt, label, [tag]).
    let tag = nonNums.find((t) => knownTags.has(t.toLowerCase())) || '';
    const rest = nonNums.filter((t) => t !== tag);
    const label = rest.length ? rest[rest.length - 1] : '';
    // fallback: infer the tag from the label when Match Tag is not authored
    // (e.g. "Travel & Flights" contains the "travel" card tag).
    if (!tag && label) {
      const lower = label.toLowerCase();
      tag = [...knownTags].find((kt) => lower.includes(kt)) || '';
    }
    return {
      row,
      label,
      tag: tag.toLowerCase(),
      iconSrc: img ? img.getAttribute('src') : '',
      iconAlt: img ? (img.getAttribute('alt') || '') : '',
      def: defText ? parseInt(defText, 10) : min,
      min,
      max,
      step: step || 500,
    };
  });

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
    moveInstrumentation(cat.row, field);

    const label = document.createElement('div');
    label.className = 'savings-calculator-field-label';
    if (cat.iconSrc) {
      const iconWrap = document.createElement('span');
      iconWrap.className = 'savings-calculator-field-icon';
      iconWrap.append(createOptimizedPicture(cat.iconSrc, cat.iconAlt || cat.label, false, [{ width: '40' }]));
      label.append(iconWrap);
    }
    const labelText = document.createElement('span');
    labelText.textContent = cat.label;
    label.append(labelText);

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

    // paint the track blue from the start up to the thumb
    const paint = () => {
      const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
      input.style.setProperty('--fill', `${pct}%`);
    };
    paint();

    input.addEventListener('input', () => {
      state[i] = parseInt(input.value, 10);
      paint();
      // eslint-disable-next-line no-use-before-define
      update();
    });
    input.paint = paint;

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
      if (inp) { inp.value = c.def; if (inp.paint) inp.paint(); }
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

  // one persistent, instrumented node per referenced card (reused on update)
  cards.forEach((card) => {
    const el = document.createElement('div');
    moveInstrumentation(card.row, el);
    card.el = el;
  });

  const cardHasTag = (card, tag) => (card.data.tags || '')
    .split(',').map((t) => t.trim().toLowerCase()).includes(tag);

  function update() {
    const total = state.reduce((a, b) => a + b, 0);
    spendTotal.textContent = `${inr(total)}/mo`;

    // per-field spend value (no per-category savings without rate data)
    spend.querySelectorAll('.savings-calculator-field').forEach((field) => {
      const i = parseInt(field.dataset.index, 10);
      field.valueEl.textContent = inr(state[i]);
    });

    // best match = card tagged for the highest-spend category
    let bestTag = '';
    let maxSpend = -1;
    categories.forEach((cat, i) => {
      if (state[i] > maxSpend) { maxSpend = state[i]; bestTag = cat.tag; }
    });
    const best = cards.find((c) => bestTag && cardHasTag(c, bestTag)) || cards[0];

    result.replaceChildren();
    if (!best) return;

    const d = best.data;
    best.el.className = 'savings-calculator-best';
    best.el.innerHTML = `
      <div class="savings-calculator-best-body">
        <p class="savings-calculator-best-flag">Best match for you</p>
        <h3 class="savings-calculator-best-name">${d.name || ''}</h3>
        ${d.badge ? `<span class="savings-calculator-best-badge">${d.badge}</span>` : ''}
      </div>
    `;
    if (d.imageSrc) {
      const media = document.createElement('div');
      media.className = 'savings-calculator-best-media';
      media.append(createOptimizedPicture(d.imageSrc, d.imageAlt || d.name || '', false, [{ width: '500' }]));
      best.el.append(media);
    }
    if (d.applyText) {
      const applyA = document.createElement('a');
      applyA.href = d.applyHref || '#';
      applyA.className = 'savings-calculator-apply';
      applyA.textContent = d.applyText;
      best.el.querySelector('.savings-calculator-best-body').append(applyA);
    }
    result.append(best.el);

    const others = cards.filter((c) => c !== best);
    if (others.length) {
      const oh = document.createElement('p');
      oh.className = 'savings-calculator-others-title';
      oh.textContent = 'Other Recommended Cards';
      result.append(oh);
      const list = document.createElement('div');
      list.className = 'savings-calculator-others';
      others.forEach((c) => {
        const od = c.data;
        c.el.className = 'savings-calculator-other';
        c.el.innerHTML = `
          <div class="savings-calculator-other-body">
            <p class="savings-calculator-other-flag">Best match for you</p>
            <span class="savings-calculator-other-name">${od.name || ''}</span>
            ${od.badge ? `<span class="savings-calculator-other-badge">${od.badge}</span>` : ''}
          </div>
        `;
        if (od.imageSrc) {
          const media = document.createElement('div');
          media.className = 'savings-calculator-other-media';
          media.append(createOptimizedPicture(od.imageSrc, od.imageAlt || od.name || '', false, [{ width: '300' }]));
          c.el.append(media);
        }
        list.append(c.el);
      });
      result.append(list);
    }
  }

  update();

  block.textContent = '';
  block.append(wrapper);
}
