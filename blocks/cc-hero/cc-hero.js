import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * CC Hero — full-width banner with a background image and overlaid
 * heading, subtext, and up to two CTAs (primary + secondary).
 * Cells are identified by content (not fixed positions) because field
 * collapsing merges link+text pairs, so the rendered cell count varies:
 *   - a cell with a <picture> is the background image
 *   - a cell with heading/paragraph rich text is the copy
 *   - each remaining cell with an <a> is a CTA (1st = primary, 2nd = secondary)
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r);

  const imageCell = cells.find((c) => c.querySelector('picture'));
  const linkCells = cells.filter((c) => c !== imageCell && c.querySelector('a'));
  // alt text = a short text-only cell (no links, no headings) right after image
  const altCell = cells.find((c) => c !== imageCell
    && !c.querySelector('a, h1, h2, h3, h4, h5, h6, ul, ol')
    && c.textContent.trim()
    && c.textContent.trim().length < 120
    && !c.querySelector('p:nth-of-type(2)'));
  // copy = the cell holding the heading/paragraphs
  const copyCell = cells.find((c) => c !== imageCell && c !== altCell
    && !c.querySelector('a')
    && c.querySelector('h1, h2, h3, h4, h5, h6, p'));

  const altText = altCell ? altCell.textContent.trim() : '';

  // background image (LCP candidate)
  const media = document.createElement('div');
  media.className = 'cc-hero-image';
  const picture = imageCell ? imageCell.querySelector('picture') : null;
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      if (altText) img.setAttribute('alt', altText);
      const optimized = createOptimizedPicture(
        img.src,
        img.getAttribute('alt') || '',
        true,
        [{ media: '(min-width: 900px)', width: '1600' }, { width: '750' }],
      );
      optimized.querySelector('img').setAttribute('fetchpriority', 'high');
      media.append(optimized);
    } else {
      media.append(picture);
    }
  }

  // content overlay
  const content = document.createElement('div');
  content.className = 'cc-hero-content';
  if (copyCell) {
    while (copyCell.firstChild) content.append(copyCell.firstChild);
  }

  // CTAs — first link cell = primary, second = secondary
  const actions = document.createElement('div');
  actions.className = 'cc-hero-actions';
  linkCells.forEach((c, i) => {
    const link = c.querySelector('a');
    if (!link) return;
    link.className = i === 0
      ? 'cc-hero-btn cc-hero-btn-primary'
      : 'cc-hero-btn cc-hero-btn-secondary';
    actions.append(link);
  });
  if (actions.children.length) content.append(actions);

  block.textContent = '';
  block.append(media, content);
}
