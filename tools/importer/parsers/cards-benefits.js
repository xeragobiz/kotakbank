/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-benefits. Base: cards-benefits (container/cards block).
 * Source: https://www.kotak811.bank.in/ — main section.undefined (4-up offers grid)
 * Convention: container block, one row per card. Cell 1 = image/icon
 *   (image + imageAlt collapse into <img>). Cell 2 = text (richtext):
 *   heading (title) + description + optional CTA. Empty cells still included.
 */
export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('li')];

  const cells = [];

  items.forEach((li) => {
    const img = li.querySelector('picture, img');
    const heading = li.querySelector('h1, h2, h3, h4, h5, h6');
    const desc = li.querySelector('p');
    const cta = li.querySelector('a');

    // Cell 1: image/icon — image + imageAlt collapse into the <img>.
    // Empty cell still included (no field hint on empty cells).
    const imgCell = document.createDocumentFragment();
    if (img) {
      imgCell.appendChild(document.createComment(' field:image '));
      imgCell.appendChild(img);
    }

    // Cell 2: text (richtext) — heading + one-line description + optional CTA
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (heading) textCell.appendChild(heading);
    if (desc) textCell.appendChild(desc);
    if (cta) textCell.appendChild(cta);

    cells.push([imgCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-benefits', cells });
  element.replaceWith(block);
}
