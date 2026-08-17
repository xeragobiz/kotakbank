import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Sub Nav — a horizontal sub-navigation bar of links to sibling pages
 * (e.g. Features, Exclusive Offers, FAQs). The link matching the current
 * page is highlighted; authors may also force-mark an item active by typing
 * "active" in its (optional) State cell.
 * Each item is a multi-cell row: link + optional state text.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const here = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');

  const nav = document.createElement('nav');
  nav.className = 'sub-nav-bar';
  nav.setAttribute('aria-label', 'Section navigation');
  const list = document.createElement('ul');
  list.className = 'sub-nav-list';

  rows.forEach((row) => {
    const cells = [...row.children].map((c) => c.querySelector(':scope > div') || c);
    const link = row.querySelector('a');
    const stateText = cells
      .map((c) => (c.querySelector('a') ? '' : c.textContent.trim().toLowerCase()))
      .find(Boolean) || '';

    const li = document.createElement('li');
    li.className = 'sub-nav-item';
    moveInstrumentation(row, li);

    if (link) {
      const href = link.getAttribute('href') || '';
      const path = href.replace(/\.html$/, '').replace(/\/$/, '');
      const a = document.createElement('a');
      a.href = href;
      a.className = 'sub-nav-link';
      a.textContent = link.textContent.trim();
      // active = explicit "active" state OR the link points to the current page
      const isActive = stateText === 'active' || (path && path === here);
      if (isActive) {
        a.classList.add('sub-nav-link-active');
        a.setAttribute('aria-current', 'page');
      }
      li.append(a);
    }

    list.append(li);
  });

  nav.append(list);
  block.textContent = '';
  block.append(nav);
}
