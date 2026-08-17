/* eslint-disable */
/* global WebImporter */
/**
 * Parser for k811-cta. Base: k811-cta.
 * Source: https://www.kotak811.bank.in/ — main section.blackWrap (toll-free band)
 * Model fields (simple block, one row per field, in model order):
 *   image (+imageAlt collapse into <img>), title (text = heading),
 *   ctaLink (+ctaLinkText collapse into <a>).
 * decorate() identifies cells by content, so a missing CTA/image is handled.
 */
export default function parse(element, { document }) {
  // Optional background/decorative image (drop placeholder "null" alt)
  const img = element.querySelector('picture, img');
  if (img && (img.getAttribute('alt') || '').trim().toLowerCase() === 'null') {
    img.setAttribute('alt', '');
  }

  // Heading: the section h2 wraps its real text in a <p>, plus a sibling
  // .raw-html-embed carrying inline CSS — use only the <p> text so the style
  // block doesn't leak into the heading.
  const headingEl = element.querySelector('h1, h2, h3, h4, h5, h6');
  const headingP = headingEl ? headingEl.querySelector('p') : null;
  const headingText = (headingP || headingEl)
    ? (headingP || headingEl).textContent.trim()
    : '';

  // Optional CTA link
  const cta = element.querySelector('a[href]');

  const cells = [];

  // Row: image — image + imageAlt collapse into the <img>
  if (img) {
    const imgFrag = document.createDocumentFragment();
    imgFrag.appendChild(document.createComment(' field:image '));
    imgFrag.appendChild(img);
    cells.push([imgFrag]);
  }

  // Row: title (heading)
  if (headingText) {
    const titleFrag = document.createDocumentFragment();
    titleFrag.appendChild(document.createComment(' field:title '));
    const h = document.createElement('h2');
    h.textContent = headingText;
    titleFrag.appendChild(h);
    cells.push([titleFrag]);
  }

  // Row: ctaLink — ctaLinkText collapses into the <a>
  if (cta) {
    const ctaFrag = document.createDocumentFragment();
    ctaFrag.appendChild(document.createComment(' field:ctaLink '));
    ctaFrag.appendChild(cta);
    cells.push([ctaFrag]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'k811-cta', cells });
  element.replaceWith(block);
}
