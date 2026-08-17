import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/**
 * K811 App CTA — "Download the app" band.
 * Faithful to kotak811.bank.in: a centered column with the QR/app image on top
 * and the heading lines stacked below, on the section's black background.
 * Rows (model order): image, title (rich text with one or more headings and an
 * optional CTA link). Either may be omitted.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];
  const cellOf = (r) => (r ? r.querySelector(':scope > div') || r : null);
  const cells = rows.map(cellOf).filter(Boolean);

  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  const img = imageCell ? imageCell.querySelector('img') : null;
  const titleCell = cells.find((c) => c !== imageCell && c.textContent.trim());

  const inner = document.createElement('div');
  inner.className = 'k811-app-cta-inner';

  if (img) {
    const media = document.createElement('div');
    media.className = 'k811-app-cta-media';
    media.append(createOptimizedPicture(img.src, img.getAttribute('alt') || '', false, [{ width: '300' }]));
    inner.append(media);
  }

  if (titleCell) {
    const text = document.createElement('div');
    text.className = 'k811-app-cta-text';
    titleCell.querySelectorAll('h1, h2, h3, h4').forEach((hEl) => {
      const h = document.createElement('h2');
      h.className = 'k811-app-cta-title';
      h.textContent = hEl.textContent.trim();
      text.append(h);
    });
    const link = titleCell.querySelector('a');
    if (link) {
      link.classList.add('k811-app-cta-btn');
      text.append(link);
    }
    inner.append(text);
  }

  block.textContent = '';
  block.append(inner);

  revealOnScroll(inner);
}
