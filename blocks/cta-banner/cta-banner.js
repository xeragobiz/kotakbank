import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * CTA Banner — "Ready to take the next step?".
 * Full-width band (gradient by default, or an optional background image) with a
 * heading and a single Apply button.
 * Rows (in model order): background image, heading, cta link, cta text.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cellOf = (r) => (r ? r.querySelector(':scope > div') || r : null);

  const cells = rows.map(cellOf).filter(Boolean);
  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  const linkCell = cells.find((c) => c.querySelector('a'));
  // text cells in order (excluding image/link): [imageAlt?, heading, ctaText?]
  const textCells = cells.filter((c) => c !== imageCell && c !== linkCell
    && c.textContent.trim());
  const bgImg = imageCell ? imageCell.querySelector('img') : null;
  // when an image is present the first text cell is its alt; the heading is the
  // next text cell (falls back to the first when no image/alt is authored)
  const texts = textCells.map((c) => c.textContent.trim());
  const bgAlt = bgImg && texts.length > 1 ? texts.shift() : '';
  const heading = texts.shift() || '';
  const link = linkCell ? linkCell.querySelector('a') : null;
  const ctaHref = link ? link.getAttribute('href') : '';
  const ctaText = (link && link.textContent.trim()) || texts.shift() || '';

  // optional background image layer (gradient shows as fallback if none)
  let media = null;
  if (bgImg) {
    media = document.createElement('div');
    media.className = 'cta-banner-media';
    media.append(createOptimizedPicture(bgImg.src, bgAlt || bgImg.getAttribute('alt') || '', false, [{ width: '1600' }]));
  }

  const inner = document.createElement('div');
  inner.className = 'cta-banner-inner';

  if (heading) {
    const h = document.createElement('h2');
    h.className = 'cta-banner-title';
    h.textContent = heading;
    inner.append(h);
  }
  if (ctaHref && ctaText) {
    const a = document.createElement('a');
    a.href = ctaHref;
    a.className = 'cta-banner-btn';
    a.textContent = ctaText;
    inner.append(a);
  }

  block.textContent = '';
  if (media) {
    block.classList.add('cta-banner-has-image');
    block.append(media);
  }
  block.append(inner);
}
