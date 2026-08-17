import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * k811-feature-grid — "Additional Features" 2x2 card grid, matching the
 * Infinity Metal page: dark rounded cards, a large icon on the left of a white
 * heading + gray description.
 *
 * Content model: optional single-cell title row, then one row per feature with
 * two cells: (1) icon <picture>, (2) heading + short paragraph.
 */
export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];
  const titleRow = rows.find((row) => row.children.length === 1
    && !row.querySelector('picture'));
  const cardRows = rows.filter((row) => row !== titleRow);

  const nodes = [];
  if (titleRow) {
    const titleText = titleRow.textContent.trim();
    if (titleText) {
      const h = document.createElement('h2');
      h.className = 'k811-feature-grid-title';
      moveInstrumentation(titleRow, h);
      h.textContent = titleText;
      nodes.push(h);
    }
  }

  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'k811-feature-grid-icon';
      else div.className = 'k811-feature-grid-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  nodes.push(ul);
  block.replaceChildren(...nodes);

  revealOnScroll(ul);
}
