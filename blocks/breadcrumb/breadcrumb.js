import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Breadcrumb — a simple trail of links ending in the current page.
 * Each crumb item is a multi-cell row: label + optional link. Crumbs with a
 * link render as anchors; the last crumb (or any without a link) renders as
 * plain current-page text. Items keep their data-aue-* so they stay editable.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  const nav = document.createElement('nav');
  nav.className = 'breadcrumb-nav';
  nav.setAttribute('aria-label', 'Breadcrumb');
  const list = document.createElement('ol');
  list.className = 'breadcrumb-list';

  // Always render an <li> per authored row (even empty ones) and preserve its
  // data-aue-* instrumentation, so a newly-added crumb stays visible and
  // editable in Universal Editor before its label/link is filled in.
  rows.forEach((row) => {
    const cells = [...row.children].map((c) => c.querySelector(':scope > div') || c);
    const link = row.querySelector('a');
    const label = cells
      .map((c) => (c.querySelector('a') ? '' : c.textContent.trim()))
      .find(Boolean) || (link ? link.textContent.trim() : '');

    const li = document.createElement('li');
    li.className = 'breadcrumb-item';
    moveInstrumentation(row, li);

    const href = link ? link.getAttribute('href') : '';
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.className = 'breadcrumb-link';
      a.textContent = label || link.textContent.trim();
      li.append(a);
    } else {
      const span = document.createElement('span');
      span.className = 'breadcrumb-current';
      span.setAttribute('aria-current', 'page');
      span.textContent = label;
      li.append(span);
    }

    list.append(li);
  });

  nav.append(list);
  block.textContent = '';
  block.append(nav);

  // On mobile the breadcrumb is hidden; instead surface a single "← <parent>"
  // back button inside the detail hero (matching the design). The parent is the
  // last linked crumb (the one just before the current, unlinked, page).
  const links = [...list.querySelectorAll('a.breadcrumb-link')];
  const parent = links[links.length - 1];
  const hero = document.querySelector('.cc-hero.detail');
  if (parent && hero && !hero.querySelector('.cc-hero-back')) {
    const back = document.createElement('a');
    back.className = 'cc-hero-back';
    back.href = parent.getAttribute('href');
    back.innerHTML = `<span class="cc-hero-back-icon" aria-hidden="true"></span><span>${parent.textContent.trim()}</span>`;
    // sits at the very top of the hero, above the card image
    hero.prepend(back);
  }
}
