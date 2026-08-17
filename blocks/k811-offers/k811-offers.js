import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];
  // block-level "title" renders as a single-cell row; benefit-card items have
  // two cells (icon + text). Split the optional title off the card rows.
  const titleRow = rows.find((row) => row.children.length === 1
    && !row.querySelector('picture'));
  const cardRows = rows.filter((row) => row !== titleRow);

  const nodes = [];
  if (titleRow) {
    const titleText = titleRow.textContent.trim();
    if (titleText) {
      const h = document.createElement('h2');
      h.className = 'k811-offers-title';
      moveInstrumentation(titleRow, h);
      h.textContent = titleText;
      nodes.push(h);
    }
  }

  /* change to ul, li */
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'k811-offers-card-image';
      else div.className = 'k811-offers-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  nodes.push(ul);
  block.replaceChildren(...nodes);

  // AOS-faithful reveal: pure opacity fade-in on the offers list (source
  // applies fade-in to the ul.Home_flexcards element).
  revealOnScroll(ul);
}
