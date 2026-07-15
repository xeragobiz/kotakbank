import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { loadCreditCard, cardReferencePath, isCardReference } from '../../scripts/credit-card.js';
import openCompareModal from '../../scripts/compare-modal.js';

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
  // identity used by the compare popup
  li.dataset.cardName = data.name || '';
  li.dataset.cardPath = data.path || '';
  li.dataset.cardImage = data.imageSrc || '';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'cards-lifestyle-item-image';
  if (data.imageSrc) {
    imgWrap.append(createOptimizedPicture(data.imageSrc, data.imageAlt, false, [{ width: '400' }]));
  }
  li.append(imgWrap);

  const body = document.createElement('div');
  body.className = 'cards-lifestyle-item-body';
  // title on the left, badge on the right in a single row
  if (data.name || data.badge) {
    const head = document.createElement('div');
    head.className = 'cards-lifestyle-item-head';
    if (data.name) {
      const h3 = document.createElement('h3');
      h3.className = 'cards-lifestyle-item-title';
      h3.textContent = data.name;
      head.append(h3);
    }
    if (data.badge) {
      const b = document.createElement('span');
      b.className = 'cards-lifestyle-item-badge';
      // expose the badge text as a data attribute so CSS can color-code it
      b.dataset.badge = data.badge.toLowerCase();
      b.textContent = data.badge;
      head.append(b);
    }
    body.append(head);
  }
  let feesParts = [];
  if (data.feesParts && data.feesParts.length) feesParts = data.feesParts;
  else if (data.fees) feesParts = [data.fees];
  if (feesParts.length) {
    const f = document.createElement('p');
    f.className = 'cards-lifestyle-item-fees';
    // each fee part in its own span (16px gap); value (₹/Nil) bold + brighter
    f.innerHTML = feesParts.map((part) => `<span class="cards-lifestyle-item-fee">${
      part.replace(/(₹\s*[\d,]+|₹\s*nil|\bnil\b)/gi, '<span class="cards-lifestyle-item-fees-value">$1</span>')
    }</span>`).join('');
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
  // footer: Know More on the left, Compare button on the right
  const foot = document.createElement('div');
  foot.className = 'cards-lifestyle-item-footer';
  if (data.knowMoreText) {
    const km = document.createElement('a');
    km.href = data.knowMoreHref || '#';
    km.className = 'cards-lifestyle-knowmore';
    km.textContent = data.knowMoreText;
    foot.append(km);
  }
  // Compare opens the comparison popup with this card pre-added (all cards)
  const cmp = document.createElement('button');
  cmp.type = 'button';
  cmp.className = 'cards-lifestyle-compare';
  cmp.textContent = data.compareText || 'Compare';
  foot.append(cmp);
  body.append(foot);

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

  // chrome rows in authored field order (empty rows preserved for positional
  // mapping): heading, sub-heading, filters, categories.
  // Filters field: "Label | a, b, c" (label before the optional pipe).
  // Categories field supports the same, PLUS an optional per-tab mapping so
  // row 2 chips depend on the row 1 selection:
  //   "Label | Cashback: Bills, Max Rewards; Travel: Premium, Most Popular"
  // Use "All: ..." for the default tab. A plain comma list (no colons) shows
  // the same chips for every tab.
  const chromeText = chromeRows
    .map((r) => (r.querySelector(':scope > div') || r).textContent.trim());
  const [heading, subtitle, filtersRaw, categoriesRaw] = chromeText;
  const parseRow = (s) => {
    const raw = s || '';
    const [labelPart, listPart] = raw.includes('|') ? raw.split('|') : ['', raw];
    return {
      label: labelPart.trim(),
      values: (listPart || '').split(',').map((t) => t.trim()).filter(Boolean),
    };
  };
  const parseCategories = (s) => {
    const raw = s || '';
    const [labelPart, bodyPart] = raw.includes('|') ? raw.split('|') : ['', raw];
    const label = labelPart.trim();
    const body = (bodyPart || '').trim();
    if (body.includes(':')) {
      const map = {};
      body.split(';').forEach((group) => {
        const idx = group.indexOf(':');
        if (idx < 0) return;
        const key = group.slice(0, idx).trim().toLowerCase();
        const chips = group.slice(idx + 1).split(',').map((t) => t.trim()).filter(Boolean);
        if (key && chips.length) map[key] = chips;
      });
      return { label, map };
    }
    const flat = body.split(',').map((t) => t.trim()).filter(Boolean);
    return { label, flat };
  };
  const row1 = parseRow(filtersRaw);
  const filtersLabel = row1.label;
  const filters = row1.values.length ? row1.values : ['All'];
  const cat = parseCategories(categoriesRaw);
  const categoriesLabel = cat.label;
  // chips shown for a given (lowercased) row-1 filter. With an explicit map,
  // only tabs listed in the map show chips (a tab with no entry hides row 2);
  // the "all" entry serves the default "All" tab. A flat list (no mapping)
  // shows the same chips for every tab.
  const chipsFor = (filterLower) => {
    if (cat.map) return cat.map[filterLower] || [];
    return cat.flat || [];
  };
  const hasCategories = !!(cat.map ? Object.keys(cat.map).length : (cat.flat && cat.flat.length));

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

  // filter panel: one or two rows, each a label + a set of chips
  const panel = document.createElement('div');
  panel.className = 'cards-lifestyle-filters';

  const buildRow = (labelText, values, rowClass, withDefaultAll) => {
    const row = document.createElement('div');
    row.className = `cards-lifestyle-filter-row ${rowClass}`;
    if (labelText) {
      const lbl = document.createElement('span');
      lbl.className = 'cards-lifestyle-filter-label';
      lbl.textContent = labelText;
      row.append(lbl);
    }
    const group = document.createElement('div');
    group.className = 'cards-lifestyle-tabs';
    group.setAttribute('role', 'tablist');
    values.forEach((label, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cards-lifestyle-tab';
      btn.textContent = label;
      btn.dataset.filter = label.toLowerCase();
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', withDefaultAll && i === 0 ? 'true' : 'false');
      group.append(btn);
    });
    row.append(group);
    return { row, group };
  };

  const { row: tabsRow, group: tabs } = buildRow(filtersLabel, filters, 'cards-lifestyle-filter-primary', true);
  panel.append(tabsRow);

  // secondary row: rebuilt whenever the primary selection changes, showing
  // only the chips mapped to the active row-1 tab.
  let categoryGroup = null;
  if (hasCategories) {
    const { row: catRow, group } = buildRow(categoriesLabel, [], 'cards-lifestyle-filter-secondary', false);
    categoryGroup = group;
    panel.append(catRow);
  }
  wrapper.append(panel);

  // (re)populate the secondary chips for a given active row-1 filter
  const renderCategoryChips = (filterLower) => {
    if (!categoryGroup) return;
    categoryGroup.textContent = '';
    chipsFor(filterLower).forEach((label) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cards-lifestyle-tab';
      btn.textContent = label;
      btn.dataset.filter = label.toLowerCase();
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      categoryGroup.append(btn);
    });
    // hide the whole row when there are no chips for this tab
    categoryGroup.closest('.cards-lifestyle-filter-row').hidden = !chipsFor(filterLower).length;
  };

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
      if (data) data.isReference = true;
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

  // wire Compare buttons: open the popup pre-adding the clicked card, with the
  // full set of cards in this block as the pool to add more from.
  const cardPool = cards
    .filter((li) => li.dataset.cardPath)
    .map((li) => ({
      name: li.dataset.cardName,
      path: li.dataset.cardPath,
      image: li.dataset.cardImage,
    }));
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.cards-lifestyle-compare');
    if (!btn) return;
    const li = btn.closest('.cards-lifestyle-item');
    const card = {
      name: li.dataset.cardName,
      path: li.dataset.cardPath,
      image: li.dataset.cardImage,
    };
    openCompareModal(card, cardPool);
  });

  // filtering: a card must match BOTH the active primary tab and (if set) the
  // active secondary category. "all" (primary default) matches everything.
  let activeFilter = (filters[0] || 'All').toLowerCase();
  let activeCategory = '';
  const cardTags = (li) => (li.dataset.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const applyFilters = () => {
    list.querySelectorAll(':scope > li').forEach((li) => {
      const tags = cardTags(li);
      const okPrimary = activeFilter === 'all' || tags.includes(activeFilter);
      const okCategory = !activeCategory || tags.includes(activeCategory);
      li.hidden = !(okPrimary && okCategory);
    });
  };

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.cards-lifestyle-tab');
    if (!btn) return;
    tabs.querySelectorAll('.cards-lifestyle-tab').forEach((b) => b.setAttribute('aria-selected', 'false'));
    btn.setAttribute('aria-selected', 'true');
    activeFilter = btn.dataset.filter;
    // row 1 change resets row 2 selection and rebuilds its chips
    activeCategory = '';
    renderCategoryChips(activeFilter);
    applyFilters();
  });

  if (categoryGroup) {
    categoryGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.cards-lifestyle-tab');
      if (!btn) return;
      const already = btn.getAttribute('aria-selected') === 'true';
      categoryGroup.querySelectorAll('.cards-lifestyle-tab').forEach((b) => b.setAttribute('aria-selected', 'false'));
      // toggle: clicking the active chip clears the category filter
      btn.setAttribute('aria-selected', already ? 'false' : 'true');
      activeCategory = already ? '' : btn.dataset.filter;
      applyFilters();
    });
  }

  // initialize row 2 chips for the default row-1 tab
  renderCategoryChips(activeFilter);

  block.textContent = '';
  block.append(wrapper);
}
