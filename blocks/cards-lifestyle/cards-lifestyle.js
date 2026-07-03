import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { loadCreditCard, cardReferencePath, isCardReference } from '../../scripts/credit-card.js';

/**
 * Cards Lifestyle — "A Credit Card for every need".
 * Heading + sub-heading, a row of filter tabs, and a filterable card grid.
 * Each card carries comma-separated tags; clicking a tab shows only matching
 * cards ("All" shows everything).
 *
 * A card item can be authored two ways:
 *  - inline: multi-cell row (image, content group, apply link)
 *  - reference: single-anchor row pointing at a Credit Card content fragment.
 * @param {Element} block the block element
 */

/* render one card <li> from normalized data */
function renderCard(data) {
  const li = document.createElement('li');
  li.className = 'cards-lifestyle-item';
  if (data.tags) li.dataset.tags = data.tags.toLowerCase();

  const imgWrap = document.createElement('div');
  imgWrap.className = 'cards-lifestyle-item-image';
  if (data.imageSrc) {
    imgWrap.append(createOptimizedPicture(data.imageSrc, data.imageAlt, false, [{ width: '400' }]));
  }
  li.append(imgWrap);

  const body = document.createElement('div');
  body.className = 'cards-lifestyle-item-body';
  if (data.badge) {
    const b = document.createElement('span');
    b.className = 'cards-lifestyle-item-badge';
    b.textContent = data.badge;
    body.append(b);
  }
  if (data.name) {
    const h3 = document.createElement('h3');
    h3.className = 'cards-lifestyle-item-title';
    h3.textContent = data.name;
    body.append(h3);
  }
  if (data.fees) {
    const f = document.createElement('p');
    f.className = 'cards-lifestyle-item-fees';
    f.textContent = data.fees;
    body.append(f);
  }
  if (data.featuresList) {
    data.featuresList.classList.add('cards-lifestyle-item-features');
    body.append(data.featuresList);
  }
  if (data.applyText) {
    const actions = document.createElement('div');
    actions.className = 'cards-lifestyle-item-actions';
    const a = document.createElement('a');
    a.href = data.applyHref || '#';
    a.className = 'cards-lifestyle-apply';
    a.textContent = data.applyText;
    actions.append(a);
    body.append(actions);
  }
  if (data.knowMoreText) {
    const foot = document.createElement('div');
    foot.className = 'cards-lifestyle-item-footer';
    const km = document.createElement('a');
    km.href = data.knowMoreHref || '#';
    km.className = 'cards-lifestyle-knowmore';
    km.textContent = data.knowMoreText;
    foot.append(km);
    body.append(foot);
  }

  li.append(body);
  return li;
}

/* extract normalized card data from an inline-authored multi-cell row */
function inlineCardData(row) {
  const cells = [...row.children].map((c) => c.querySelector(':scope > div') || c);
  const imageCell = cells.find((c) => c.querySelector('picture'));
  const linkCell = cells.find((c) => c.querySelector('a'));
  const contentCell = cells.find((c) => c !== imageCell && c !== linkCell);

  const pic = imageCell ? imageCell.querySelector('picture') : null;
  const img = pic ? pic.querySelector('img') : null;
  const paras = contentCell ? [...contentCell.querySelectorAll(':scope > p')] : [];
  // paragraphs in order: name, badge, fees, tags
  const [name, badge, fees, tags] = paras.map((p) => p.textContent.trim());
  const featureList = contentCell ? contentCell.querySelector('ul, ol') : null;
  const link = linkCell ? linkCell.querySelector('a') : null;

  return {
    imageSrc: img ? img.src : '',
    imageAlt: img ? (img.getAttribute('alt') || '') : '',
    name,
    badge,
    fees,
    tags,
    featuresList: featureList ? featureList.cloneNode(true) : null,
    applyHref: link ? link.getAttribute('href') : '',
    applyText: link ? link.textContent.trim() : '',
  };
}

export default async function decorate(block) {
  // items: inline rows (multi-cell) or reference items (detected by *-ref
  // model, so an empty reference row is still recognized before its field set)
  const rows = [...block.children];
  const isItem = (r) => r.children.length > 1 || isCardReference(r);
  const itemRows = rows.filter(isItem);
  const chromeRows = rows.filter((r) => !isItem(r));

  // chrome: heading, sub-heading, filter list (plain text rows, in order)
  const texts = chromeRows
    .map((r) => (r.querySelector(':scope > div') || r).textContent.trim())
    .filter(Boolean);
  const [heading, subtitle, filtersRaw] = texts;
  const filters = (filtersRaw || 'All')
    .split(',').map((t) => t.trim()).filter(Boolean);

  const wrapper = document.createElement('div');
  wrapper.className = 'cards-lifestyle-inner';

  if (heading) {
    const h = document.createElement('h2');
    h.className = 'cards-lifestyle-title';
    h.textContent = heading;
    wrapper.append(h);
  }
  if (subtitle) {
    const p = document.createElement('p');
    p.className = 'cards-lifestyle-subtitle';
    p.textContent = subtitle;
    wrapper.append(p);
  }

  // filter tabs
  const tabs = document.createElement('div');
  tabs.className = 'cards-lifestyle-tabs';
  tabs.setAttribute('role', 'tablist');
  filters.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cards-lifestyle-tab';
    btn.textContent = label;
    btn.dataset.filter = label.toLowerCase();
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tabs.append(btn);
  });
  wrapper.append(tabs);

  // card grid — reference cards load async then fill in authored order
  const list = document.createElement('ul');
  list.className = 'cards-lifestyle-list';

  // A reference card ALWAYS yields an <li> (empty if the fragment can't be
  // resolved yet, e.g. in the editor) so the item keeps its data-aue-*
  // instrumentation and stays visible/editable in Universal Editor.
  const pending = itemRows.map(async (row) => {
    let data;
    if (isCardReference(row)) {
      const refPath = cardReferencePath(row);
      data = refPath ? await loadCreditCard(refPath) : null;
    } else {
      data = inlineCardData(row);
    }
    const li = renderCard(data || {});
    moveInstrumentation(row, li);
    return li;
  });

  const cards = await Promise.all(pending);
  cards.forEach((li) => list.append(li));
  wrapper.append(list);

  // filtering behaviour
  const applyFilter = (filter) => {
    list.querySelectorAll(':scope > li').forEach((li) => {
      const tags = li.dataset.tags || '';
      const show = filter === 'all' || tags.split(',').map((t) => t.trim()).includes(filter);
      li.hidden = !show;
    });
  };
  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.cards-lifestyle-tab');
    if (!btn) return;
    tabs.querySelectorAll('.cards-lifestyle-tab').forEach((b) => b.setAttribute('aria-selected', 'false'));
    btn.setAttribute('aria-selected', 'true');
    applyFilter(btn.dataset.filter);
  });

  block.textContent = '';
  block.append(wrapper);
}
