import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * k811-benefits-story — full-viewport benefit panels, matching the Infinity
 * Metal "exclusive offers" scroll story on kotak811.bank.in.
 *
 * Each authored row is one panel:
 *   cell 1 (image) — a <picture> with an art-directed desktop <img> and an
 *                    optional mobile <source media="(max-width: 899px)">.
 *   cell 2 (text)  — a heading + short paragraph, shown in a box on the left.
 *
 * Layout: on desktop the photo fills the right ~55% of a 100vh panel with the
 * text box on the left; on mobile the photo is full-bleed with the text below.
 */

export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];

  rows.forEach((row) => {
    row.classList.add('k811-benefits-story-panel');
    const cells = [...row.children];
    const mediaCell = cells.find((c) => c.querySelector('picture, img')) || cells[0];
    const textCell = cells.find((c) => c !== mediaCell && c.querySelector('h1, h2, h3, h4, p'))
      || cells[cells.length - 1];

    if (mediaCell) mediaCell.classList.add('k811-benefits-story-media');
    if (textCell) textCell.classList.add('k811-benefits-story-content');

    revealOnScroll(row);
  });
}
