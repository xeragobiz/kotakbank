/* eslint-disable */
/* global WebImporter */
/**
 * Parser for k811-offers-overlap. Base: k811-offers-overlap (homepage-only
 * variant of the shared offers grid that overlaps the metal hero).
 * Source: https://www.kotak811.bank.in/ — main section.undefined (4-up grid).
 * Same content shape as k811-offers (one row per card: image cell + text cell);
 * only the block name differs so the overlap-specific CSS/JS applies.
 */
export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('li')];

  const cells = [];

  items.forEach((li) => {
    const img = li.querySelector('picture, img');
    const heading = li.querySelector('h1, h2, h3, h4, h5, h6');
    const desc = li.querySelector('p');
    const cta = li.querySelector('a');

    const imgCell = document.createDocumentFragment();
    if (img) {
      imgCell.appendChild(document.createComment(' field:image '));
      imgCell.appendChild(img);
    }

    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (heading) textCell.appendChild(heading);
    if (desc) textCell.appendChild(desc);
    if (cta) textCell.appendChild(cta);

    cells.push([imgCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'k811-offers-overlap', cells });
  element.replaceWith(block);
}
