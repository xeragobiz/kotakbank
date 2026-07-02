import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * CC Steps — "Apply online in 3 simple steps".
 * Heading + sub-heading + a row of step cards (icon + title + description)
 * and a CTA button. Step items carry an icon image; the container's own
 * heading/subtitle/CTA are icon-free rows.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const itemRows = rows.filter((r) => r.querySelector('picture'));
  const chromeRows = rows.filter((r) => !r.querySelector('picture'));

  // chrome: heading, sub-heading, then the CTA (a link) + its label
  let heading = '';
  let subtitle = '';
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
      if (!heading) heading = txt;
      else if (!subtitle) subtitle = txt;
      else if (!ctaText) ctaText = txt;
    }
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'cc-steps-inner';

  if (heading) {
    const h = document.createElement('h2');
    h.className = 'cc-steps-title';
    h.textContent = heading;
    wrapper.append(h);
  }
  if (subtitle) {
    const p = document.createElement('p');
    p.className = 'cc-steps-subtitle';
    p.textContent = subtitle;
    wrapper.append(p);
  }

  const list = document.createElement('ul');
  list.className = 'cc-steps-list';
  itemRows.forEach((row) => {
    const cells = [...row.children].map((c) => c.querySelector(':scope > div') || c);
    const iconCell = cells.find((c) => c.querySelector('picture'));
    const rest = cells.filter((c) => c !== iconCell);
    const titleCell = rest.find((c) => c.textContent.trim()
      && !c.querySelector('p, ul, ol, h1, h2, h3, h4, h5, h6'));
    const descCells = rest.filter((c) => c !== titleCell && c.textContent.trim());

    const li = document.createElement('li');
    li.className = 'cc-steps-item';

    const icon = document.createElement('div');
    icon.className = 'cc-steps-icon';
    const pic = iconCell ? iconCell.querySelector('picture') : null;
    if (pic) {
      const img = pic.querySelector('img');
      const opt = createOptimizedPicture(img.src, img.getAttribute('alt') || '', false, [{ width: '80' }]);
      icon.append(opt);
    }
    li.append(icon);

    if (titleCell) {
      const h3 = document.createElement('h3');
      h3.className = 'cc-steps-item-title';
      h3.textContent = titleCell.textContent.trim();
      li.append(h3);
    }
    descCells.forEach((c) => {
      const p = document.createElement('p');
      p.className = 'cc-steps-item-desc';
      p.textContent = c.textContent.trim();
      li.append(p);
    });

    list.append(li);
  });
  wrapper.append(list);

  if (ctaHref && ctaText) {
    const actions = document.createElement('div');
    actions.className = 'cc-steps-actions';
    const a = document.createElement('a');
    a.href = ctaHref;
    a.className = 'cc-steps-btn';
    a.textContent = ctaText;
    actions.append(a);
    wrapper.append(actions);
  }

  block.textContent = '';
  block.append(wrapper);
}
