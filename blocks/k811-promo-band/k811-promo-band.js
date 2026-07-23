import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/**
 * k811-promo-band — full-bleed lifestyle photo with overlaid copy.
 *
 * Used for the "nearest bank" / "811 Current Account" style sections on the
 * kotak811 homepage: a full-width background photo with a heading, paragraph
 * and optional CTA confined to one side (left or right) over the image.
 *
 * Rows (in model order):
 *   1. background image — desktop (reference)
 *   2. image alt text
 *   3. background image — mobile (reference, optional)
 *   4. mobile image alt text (optional)
 *   5. copy (richtext): heading + paragraph
 *   6. CTA link (optional)
 *   7. CTA text (optional)
 *   8. alignment token ("left" | "right") (optional plain text)
 *
 * @param {Element} block the block element
 */
export default function decorate(block) {
  initK811(block);

  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r).filter(Boolean);

  // desktop + optional mobile image render as separate picture-only cells in
  // model order; the first is desktop, the second (if any) is the art-directed
  // mobile source.
  const imageCells = cells.filter((c) => c.querySelector('picture, img'));
  const [desktopCell, mobileCell] = imageCells;
  const linkCell = cells.find((c) => !imageCells.includes(c) && c.querySelector('a'));

  // alt-text cells are plain text that isn't the alignment token and hold no
  // headings (up to two: desktop + mobile), in order.
  const ALIGN = ['left', 'right'];
  const altCells = cells.filter((c) => !imageCells.includes(c) && c !== linkCell
    && !c.querySelector('h1, h2, h3, h4, h5, h6, p, a')
    && c.textContent.trim()
    && !ALIGN.includes(c.textContent.trim().toLowerCase()));

  let alignFromText = '';
  cells.forEach((c) => {
    if (imageCells.includes(c) || c === linkCell || altCells.includes(c)) return;
    const token = c.textContent.trim().toLowerCase();
    if (ALIGN.includes(token) && !c.querySelector('h1, h2, h3, h4, h5, h6')) {
      alignFromText = token;
    }
  });

  const copyCell = cells.find((c) => !imageCells.includes(c) && c !== linkCell
    && !altCells.includes(c) && c.querySelector('h1, h2, h3, h4, h5, h6, p'));

  const altText = altCells[0] ? altCells[0].textContent.trim() : '';

  // background image layer
  const media = document.createElement('div');
  media.className = 'k811-promo-band-media';
  const srcImg = desktopCell ? desktopCell.querySelector('img') : null;
  const mobileImg = mobileCell ? mobileCell.querySelector('img') : null;
  if (srcImg) {
    const picture = createOptimizedPicture(
      srcImg.src,
      altText || srcImg.getAttribute('alt') || '',
      false,
      [{ width: '1600' }],
    );
    // art-directed mobile source: prepend an optimized WebP so the browser
    // picks it below 900px (mirrors the k811-hero dual-image approach).
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

  // overlay copy
  const content = document.createElement('div');
  content.className = 'k811-promo-band-content';
  if (copyCell) {
    while (copyCell.firstChild) content.append(copyCell.firstChild);
  }
  const link = linkCell ? linkCell.querySelector('a') : null;
  if (link) {
    link.className = 'k811-promo-band-btn';
    const actions = document.createElement('p');
    actions.className = 'k811-promo-band-actions';
    actions.append(link);
    content.append(actions);
  }

  // alignment: explicit token wins, else class modifier, else default left
  const align = alignFromText || (block.classList.contains('right') ? 'right' : 'left');
  block.classList.add(`k811-promo-band-${align}`);

  block.textContent = '';
  if (media.firstChild) block.append(media);
  block.append(content);

  // AOS-faithful reveal: pure opacity fade-in.
  revealOnScroll(content);
}
