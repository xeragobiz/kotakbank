import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * CC Hero — full-width banner with a background image and overlaid
 * heading, subtext, and up to two CTAs (primary + secondary).
 * Authoring rows (in model order): image, imageAlt, text (richtext),
 * primaryCta, primaryCtaText, secondaryCta, secondaryCtaText.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cellOf = (r) => (r ? r.querySelector(':scope > div') || r : null);

  const imageCell = cellOf(rows[0]);
  const altCell = cellOf(rows[1]);
  const textCell = cellOf(rows[2]);
  const primaryLinkCell = cellOf(rows[3]);
  const primaryTextCell = cellOf(rows[4]);
  const secondaryLinkCell = cellOf(rows[5]);
  const secondaryTextCell = cellOf(rows[6]);

  const altText = altCell ? altCell.textContent.trim() : '';

  // background image
  const media = document.createElement('div');
  media.className = 'cc-hero-image';
  const picture = imageCell ? imageCell.querySelector('picture') : null;
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      if (altText) img.setAttribute('alt', altText);
      // hero image is the LCP candidate: load eagerly, high priority
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
  if (textCell) {
    while (textCell.firstChild) content.append(textCell.firstChild);
  }

  // CTAs
  const buildCta = (linkCell, textCell2, cls) => {
    const link = linkCell ? linkCell.querySelector('a') : null;
    let href = '';
    if (link) href = link.getAttribute('href');
    else if (linkCell) href = linkCell.textContent.trim();
    let label = '';
    if (textCell2 && textCell2.textContent.trim()) label = textCell2.textContent.trim();
    else if (link) label = link.textContent.trim();
    if (!href || !label) return null;
    const a = document.createElement('a');
    a.href = href;
    a.className = cls;
    a.textContent = label;
    return a;
  };

  const actions = document.createElement('div');
  actions.className = 'cc-hero-actions';
  const primary = buildCta(primaryLinkCell, primaryTextCell, 'cc-hero-btn cc-hero-btn-primary');
  const secondary = buildCta(secondaryLinkCell, secondaryTextCell, 'cc-hero-btn cc-hero-btn-secondary');
  if (primary) actions.append(primary);
  if (secondary) actions.append(secondary);
  if (actions.children.length) content.append(actions);

  block.textContent = '';
  block.append(media, content);
}
