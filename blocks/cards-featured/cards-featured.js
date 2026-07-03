import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { loadCreditCard, cardReferencePath, isCardReference } from '../../scripts/credit-card.js';

/**
 * Cards Featured — "Popular Kotak Credit Cards".
 * Section header (eyebrow/heading/description + view-all) and a grid of
 * featured card tiles.
 *
 * A card item can be authored two ways:
 *  - inline: multi-cell row (image, content group, compare link, apply link)
 *  - reference: single-anchor row pointing at a Credit Card content fragment,
 *    fetched and rendered client-side (data source of truth reused elsewhere).
 * @param {Element} block the block element
 */

/* build the highlight banner (main + optional sub line) */
function buildHighlight(highlight, highlightSub) {
  if (!highlight) return null;
  const hl = document.createElement('div');
  hl.className = 'cards-featured-item-highlight';
  const main = document.createElement('span');
  main.className = 'cards-featured-item-highlight-main';
  main.textContent = highlight;
  hl.append(main);
  if (highlightSub) {
    const sub = document.createElement('span');
    sub.className = 'cards-featured-item-highlight-sub';
    sub.textContent = highlightSub;
    hl.append(sub);
  }
  return hl;
}

/* render one card <li> from normalized data */
function renderCard(data) {
  const li = document.createElement('li');
  li.className = 'cards-featured-item';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'cards-featured-item-image';
  if (data.imageSrc) {
    imgWrap.append(createOptimizedPicture(data.imageSrc, data.imageAlt, false, [{ width: '500' }]));
  }
  li.append(imgWrap);

  const hl = buildHighlight(data.highlight, data.highlightSub);
  if (hl) li.append(hl);

  const body = document.createElement('div');
  body.className = 'cards-featured-item-body';
  if (data.name) {
    const h3 = document.createElement('h3');
    h3.className = 'cards-featured-item-title';
    h3.textContent = data.name;
    body.append(h3);
  }
  if (data.featuresList) {
    const feat = document.createElement('div');
    feat.className = 'cards-featured-item-features';
    feat.append(data.featuresList);
    body.append(feat);
  }
  if (data.fees) {
    const fees = document.createElement('p');
    fees.className = 'cards-featured-item-fees';
    fees.textContent = data.fees;
    body.append(fees);
  }

  const actions = document.createElement('div');
  actions.className = 'cards-featured-item-actions';
  if (data.compareText) {
    const c = document.createElement('a');
    c.href = data.compareHref || '#';
    c.className = 'cards-featured-compare';
    c.textContent = data.compareText;
    actions.append(c);
  }
  if (data.applyText) {
    const a = document.createElement('a');
    a.href = data.applyHref || '#';
    a.className = 'cards-featured-apply';
    a.textContent = data.applyText;
    actions.append(a);
  }
  if (actions.children.length) body.append(actions);

  li.append(body);
  return li;
}

/* extract normalized card data from an inline-authored multi-cell row */
function inlineCardData(row) {
  const cells = [...row.children].map((c) => c.querySelector(':scope > div') || c);
  const [imageCell] = cells;
  const linkCells = cells.filter((c) => c.querySelector('a'));
  const contentCell = cells.find((c) => c !== imageCell
    && !c.querySelector('a')
    && c.textContent.trim());

  const pic = imageCell ? imageCell.querySelector('picture') : null;
  const img = pic ? pic.querySelector('img') : null;
  const paras = contentCell ? [...contentCell.querySelectorAll(':scope > p')] : [];
  const [highlight, highlightSub, name, fees] = paras.map((p) => p.textContent.trim());
  const featureList = contentCell ? contentCell.querySelector('ul, ol') : null;
  const [compareLink, applyLink] = linkCells.map((c) => c.querySelector('a'));

  return {
    imageSrc: img ? img.src : '',
    imageAlt: img ? (img.getAttribute('alt') || '') : '',
    highlight,
    highlightSub,
    name,
    fees,
    featuresList: featureList ? featureList.cloneNode(true) : null,
    compareHref: compareLink ? compareLink.getAttribute('href') : '',
    compareText: compareLink ? compareLink.textContent.trim() : '',
    applyHref: applyLink ? applyLink.getAttribute('href') : '',
    applyText: applyLink ? applyLink.textContent.trim() : '',
  };
}

export default async function decorate(block) {
  // Classify rows: header fields are single-cell rows; a card is either a
  // multi-cell inline row or a reference item (which may be empty before its
  // fragment field is set, so it is detected by its *-ref model, not by cells).
  const rows = [...block.children];
  const isItem = (r) => r.children.length > 1 || isCardReference(r);
  const itemRows = rows.filter(isItem);
  const chromeRows = rows.filter((r) => !isItem(r));

  // header chrome: eyebrow, heading, description (text) + bottom CTA link
  const texts = [];
  let ctaHref = '';
  let ctaText = '';
  chromeRows.forEach((r) => {
    const cell = r.querySelector(':scope > div') || r;
    const link = cell.querySelector('a');
    const txt = cell.textContent.trim();
    if (link) {
      ctaHref = link.getAttribute('href');
      if (link.textContent.trim()) ctaText = link.textContent.trim();
    } else if (txt) {
      texts.push(txt);
    }
  });
  const [eyebrow, heading, description] = texts;

  const wrapper = document.createElement('div');
  wrapper.className = 'cards-featured-inner';

  const header = document.createElement('div');
  header.className = 'cards-featured-header';
  if (eyebrow) {
    const e = document.createElement('p');
    e.className = 'cards-featured-eyebrow';
    e.textContent = eyebrow;
    header.append(e);
  }
  if (heading) {
    const h = document.createElement('h2');
    h.className = 'cards-featured-title';
    h.textContent = heading;
    header.append(h);
  }
  if (description) {
    const p = document.createElement('p');
    p.className = 'cards-featured-desc';
    p.textContent = description;
    header.append(p);
  }
  wrapper.append(header);

  const list = document.createElement('ul');
  list.className = 'cards-featured-list';

  // build cards in authored order; reference cards load async then fill in place.
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

  if (ctaHref && ctaText) {
    const foot = document.createElement('div');
    foot.className = 'cards-featured-footer';
    const a = document.createElement('a');
    a.href = ctaHref;
    a.className = 'cards-featured-explore';
    a.textContent = ctaText;
    foot.append(a);
    wrapper.append(foot);
  }

  block.textContent = '';
  block.append(wrapper);
}
