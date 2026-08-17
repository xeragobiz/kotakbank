/* eslint-disable */
/* global WebImporter */
/**
 * Parser for k811-promo-band. Base: k811-promo-band.
 * Source: https://www.kotak811.bank.in/ — the full-bleed "nearest bank" and
 *   "811 Current Account" bands (section.Home_bgsection__xBdzU). Each is a
 *   full-width lifestyle photo with a heading + paragraph + optional CTA
 *   overlaid on one side.
 * Project's k811-promo-band is a SIMPLE block with a named model, so field
 *   hints ARE required (per blocks/k811-promo-band/_k811-promo-band.json).
 * Model fields: image + imageAlt (collapse into <img>), copy (richtext:
 *   heading + paragraph), ctaLink + ctaLinkText (collapse into <a>), align
 *   (left | right, plain text token).
 * Alignment is read from the source layout: the copy column sits on the right
 *   (col-start-8) for the current-account band, left otherwise.
 */
export default function parse(element, { document }) {
  const img = element.querySelector('picture img, img');
  const headings = [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  const paras = [...element.querySelectorAll('p')].filter((p) => p.textContent.trim());
  const cta = element.querySelector('a[href]');

  // detect copy side from the source grid: col-start-8 => right, else left
  const rightAligned = !!element.querySelector('[class*="col-start-8"], [class*="col-start-9"], [class*="ml-auto"]');
  const align = rightAligned ? 'right' : 'left';

  const cells = [];

  // Row: image — image + imageAlt collapse into the <img>
  if (img) {
    const imgFrag = document.createDocumentFragment();
    imgFrag.appendChild(document.createComment(' field:image '));
    imgFrag.appendChild(img);
    cells.push([imgFrag]);
  }

  // Row: copy (richtext) — heading(s) + paragraph(s), excluding the CTA anchor
  const copyFrag = document.createDocumentFragment();
  copyFrag.appendChild(document.createComment(' field:copy '));
  headings.forEach((h) => copyFrag.appendChild(h));
  paras
    .filter((p) => !(cta && p.contains(cta)))
    .forEach((p) => copyFrag.appendChild(p));
  cells.push([copyFrag]);

  // Row: ctaLink — ctaLink + ctaLinkText collapse into the <a> (only if present)
  if (cta) {
    const ctaFrag = document.createDocumentFragment();
    ctaFrag.appendChild(document.createComment(' field:ctaLink '));
    ctaFrag.appendChild(cta);
    cells.push([ctaFrag]);
  }

  // Row: align — plain-text token
  const alignFrag = document.createDocumentFragment();
  alignFrag.appendChild(document.createComment(' field:align '));
  const alignP = document.createElement('p');
  alignP.textContent = align;
  alignFrag.appendChild(alignP);
  cells.push([alignFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'k811-promo-band', cells });
  element.replaceWith(block);
}
