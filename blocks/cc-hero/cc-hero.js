import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Emit media-scoped <link rel="preload" as="image"> tags into <head> for the
 * WebP <source>s of a hero <picture>, so the preload scanner can discover the
 * JS-built LCP image immediately (it isn't in the initial HTML). Only the
 * art-directed WebP sources (mobile + desktop) are preloaded so exactly one
 * fetch fires per viewport — no duplicate PNG/default fetches.
 * @param {HTMLPictureElement} picture the decorated hero picture
 */
function preloadPicture(picture) {
  const links = [];
  picture.querySelectorAll('source[type="image/webp"][media]').forEach((source) => {
    const srcset = source.getAttribute('srcset');
    if (!srcset) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.setAttribute('imagesrcset', srcset);
    link.setAttribute('media', source.getAttribute('media'));
    link.setAttribute('type', 'image/webp');
    link.setAttribute('fetchpriority', 'high');
    links.push(link);
  });
  if (links.length) document.head.append(...links);
}

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

  // the image group is one cell that may hold one or two <picture>s
  // (desktop first, optional mobile second — they share the bg_ group).
  const imageCell = cells.find((c) => c.querySelector('picture'));
  const pictures = imageCell ? [...imageCell.querySelectorAll('picture')] : [];
  const linkCells = cells.filter((c) => c !== imageCell && c.querySelector('a'));
  // alt text = a short text-only cell (no links, no headings)
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

  // background image (LCP candidate). When a mobile image is authored, use a
  // <picture> with a mobile <source>; otherwise a single responsive image.
  const media = document.createElement('div');
  media.className = 'cc-hero-image';
  const desktopImg = pictures[0] ? pictures[0].querySelector('img') : null;
  const mobileImg = pictures[1] ? pictures[1].querySelector('img') : null;
  if (desktopImg) {
    if (altText) desktopImg.setAttribute('alt', altText);
    const optimized = createOptimizedPicture(
      desktopImg.src,
      desktopImg.getAttribute('alt') || '',
      true,
      [{ media: '(min-width: 900px)', width: '1600' }, { width: '750' }],
    );
    // art-directed mobile source: prepend so the browser picks it below 900px.
    // Serve optimized WebP (not the raw PNG) so the mobile LCP image is small.
    if (mobileImg) {
      const src = new URL(mobileImg.src, window.location.href);
      src.searchParams.set('width', '750');
      src.searchParams.set('format', 'webply');
      src.searchParams.set('optimize', 'medium');
      const source = document.createElement('source');
      source.setAttribute('type', 'image/webp');
      source.setAttribute('media', '(max-width: 899px)');
      source.setAttribute('srcset', src.toString());
      optimized.prepend(source);
    }
    const img = optimized.querySelector('img');
    img.setAttribute('fetchpriority', 'high');
    // explicit dimensions reserve space and avoid layout shift (CLS)
    img.setAttribute('width', '1440');
    img.setAttribute('height', '400');
    media.append(optimized);

    // Make the LCP image discoverable to the preload scanner: this hero is
    // built in JS (so it isn't in the initial HTML). Emit media-scoped
    // <link rel=preload> per <source> so the browser fetches the correct
    // (mobile vs desktop) image immediately with high priority.
    preloadPicture(optimized);
  } else if (pictures[0]) {
    media.append(pictures[0]);
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
