/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-feature. Base: columns-feature.
 * Source: https://www.kotak811.bank.in/ — used for nearest-bank, current-account,
 *   virtual-card, credit-cards-dark, and download-app sections.
 * NOTE: this project's columns-feature is a SIMPLE block with a named model
 *   (image, video, text) — one row per field — not a generic Columns block, so
 *   field hints ARE required (per blocks/columns-feature/_columns-feature.json).
 * Model fields: image (thumbnail/photo; image + imageAlt collapse into <img>),
 *   video (URL, optional), text (richtext: heading + description + optional CTA).
 *   The CTA lives inside the richtext text field — there is no separate CTA field.
 * decorate() identifies cells by content, so absent fields (no CTA, no video)
 *   simply produce no content; presence/absence handled gracefully.
 */
export default function parse(element, { document }) {
  // Feature image: prefer the desktop image, fall back to any image.
  const img = element.querySelector('img[class*="lg:block"], picture img, img');

  // Text content: heading(s) + description + optional CTA.
  const headings = [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  const paras = [...element.querySelectorAll('p')].filter((p) => p.textContent.trim());
  const cta = element.querySelector('a[href]');

  const cells = [];

  // Row: image — image + imageAlt collapse into the <img>
  if (img) {
    const imgFrag = document.createDocumentFragment();
    imgFrag.appendChild(document.createComment(' field:image '));
    imgFrag.appendChild(img);
    cells.push([imgFrag]);
  }

  // Row: text (richtext) — heading(s) + description + optional CTA
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));
  headings.forEach((h) => textFrag.appendChild(h));
  paras.forEach((p) => textFrag.appendChild(p));
  if (cta) textFrag.appendChild(cta);
  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-feature', cells });
  element.replaceWith(block);
}
