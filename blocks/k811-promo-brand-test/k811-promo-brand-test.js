import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/**
 * k811-promo-brand-test — a promo band with selectable layouts.
 *
 * Derived from k811-promo-band, but instead of an overlay-only band this block
 * supports both SPLIT layouts (image beside/above the copy) and OVERLAY layouts
 * (copy positioned on top of the image). The chosen layout is authored via a
 * "Layout" dropdown and applied as a modifier class:
 *
 *   Split layouts (image and copy in separate columns/rows):
 *     content-right   — image left,  content right
 *     content-left    — image right, content left
 *     content-top     — content top, image bottom  ("content top / image down")
 *     content-bottom  — image top,   content bottom ("content down / image top")
 *
 *   Overlay layouts (copy overlaid on the image, positioned):
 *     overlay-middle, overlay-top, overlay-bottom, overlay-left, overlay-right
 *
 * Rows (in model order):
 *   1. background/main image — desktop (reference)
 *   2. image alt text
 *   3. background/main image — mobile (reference, optional)
 *   4. mobile image alt text (optional)
 *   5. copy (richtext): heading + paragraph
 *   6. CTA link (optional)
 *   7. CTA text (optional)
 *   8. layout token (optional plain text — dropdown value)
 *
 * @param {Element} block the block element
 */

const LAYOUTS = [
  'content-right',
  'content-left',
  'content-top',
  'content-bottom',
  'overlay-middle',
  'overlay-top',
  'overlay-bottom',
  'overlay-left',
  'overlay-right',
];

export default function decorate(block) {
  initK811(block);

  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r).filter(Boolean);

  // desktop + optional mobile image. With element grouping (bg_ prefix) both
  // render inside a SINGLE cell as two <picture>s; without grouping they are
  // separate picture-only cells. Collect every <picture> across all image cells
  // in DOM order: the first is desktop, the second (if any) is the mobile source.
  const imageCells = cells.filter((c) => c.querySelector('picture, img'));
  const pictures = imageCells.flatMap((c) => [...c.querySelectorAll('picture')]);
  const desktopImg = pictures[0] ? pictures[0].querySelector('img') : null;
  const mobileImg = pictures[1] ? pictures[1].querySelector('img') : null;

  // The rich-text copy cell is the only one with a heading — this is
  // unambiguous even though the pipeline wraps plain-text cells (alt text,
  // layout token) in <p>, so we can't tell those apart by tag alone.
  const HEADINGS = 'h1, h2, h3, h4, h5, h6';
  let copyCell = cells.find((c) => !imageCells.includes(c) && c.querySelector(HEADINGS));

  const linkCell = cells.find((c) => !imageCells.includes(c) && c !== copyCell
    && c.querySelector('a'));

  // remaining text cells: the layout token + up to two alt-text cells. The
  // layout cell's text matches a known layout value; everything else is alt.
  const textCells = cells.filter((c) => !imageCells.includes(c)
    && c !== copyCell && c !== linkCell && c.textContent.trim());

  let layoutFromText = '';
  const altCells = [];
  textCells.forEach((c) => {
    const token = c.textContent.trim().toLowerCase();
    if (LAYOUTS.includes(token)) layoutFromText = token;
    else altCells.push(c);
  });

  // fallback: no heading authored — use the first text cell that isn't alt/token
  // as the copy, so a paragraph-only copy still renders.
  if (!copyCell && altCells.length) {
    copyCell = altCells.shift();
  }

  const altText = altCells[0] ? altCells[0].textContent.trim() : '';

  // image layer
  const media = document.createElement('div');
  media.className = 'k811-promo-brand-test-media';
  if (desktopImg) {
    const picture = createOptimizedPicture(
      desktopImg.src,
      altText || desktopImg.getAttribute('alt') || '',
      false,
      [{ width: '1600' }],
    );
    // art-directed mobile source: prepend an optimized WebP so the browser picks
    // it below 900px (mirrors the k811-hero dual-image approach).
    if (mobileImg) {
      const src = new URL(mobileImg.src, window.location.href);
      src.searchParams.set('width', '750');
      src.searchParams.set('format', 'webply');
      src.searchParams.set('optimize', 'medium');
      const source = document.createElement('source');
      source.setAttribute('type', 'image/webp');
      source.setAttribute('media', '(max-width: 899px)');
      source.setAttribute('srcset', src.toString());
      picture.prepend(source);
    }
    media.append(picture);
  }

  // copy
  const content = document.createElement('div');
  content.className = 'k811-promo-brand-test-content';
  const inner = document.createElement('div');
  inner.className = 'k811-promo-brand-test-copy';
  if (copyCell) {
    while (copyCell.firstChild) inner.append(copyCell.firstChild);
  }
  content.append(inner);

  const link = linkCell ? linkCell.querySelector('a') : null;
  if (link) {
    link.className = 'k811-promo-brand-test-btn';
    const actions = document.createElement('p');
    actions.className = 'k811-promo-brand-test-actions';
    actions.append(link);
    inner.append(actions);
  }

  // layout: explicit token wins, else any layout class already on the block,
  // else default to content-right.
  const classLayout = LAYOUTS.find((l) => block.classList.contains(l));
  const layout = layoutFromText || classLayout || 'content-right';
  block.classList.add(`k811-promo-brand-test-${layout}`);
  if (layout.startsWith('overlay')) block.classList.add('k811-promo-brand-test-is-overlay');

  block.textContent = '';
  if (media.firstChild) block.append(media);
  block.append(content);

  // AOS-faithful reveal: pure opacity fade-in.
  revealOnScroll(content);
}
