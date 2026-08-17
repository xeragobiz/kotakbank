import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/**
 * CTA Banner — rounded dark "call us" band.
 * A contained black box with a heading on the left and a promo graphic on the
 * right (stacks on mobile).
 * Rows (in model order): image, title. Either may be omitted.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];
  const cellOf = (r) => (r ? r.querySelector(':scope > div') || r : null);

  const cells = rows.map(cellOf).filter(Boolean);
  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  const img = imageCell ? imageCell.querySelector('img') : null;
  // the title is the first text-bearing cell that isn't the image cell
  const titleCell = cells.find((c) => c !== imageCell && c.textContent.trim());
  const title = titleCell ? titleCell.textContent.trim() : '';

  const inner = document.createElement('div');
  inner.className = 'k811-cta-inner';

  if (title) {
    const text = document.createElement('div');
    text.className = 'k811-cta-text';
    const h = document.createElement('h2');
    h.className = 'k811-cta-title';
    // Highlight a toll-free number (e.g. "1800 4100") in brand red, per the
    // source. Escape first, then wrap the matched digits in a red span.
    const safe = title.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
    h.innerHTML = safe.replace(/(\d{4}\s?\d{4})/, '<span class="k811-cta-highlight">$1</span>');
    text.append(h);
    inner.append(text);
  }

  if (img) {
    const media = document.createElement('div');
    media.className = 'k811-cta-media';
    media.append(createOptimizedPicture(img.src, img.getAttribute('alt') || '', false, [{ width: '750' }]));
    inner.append(media);
  }

  block.textContent = '';
  block.append(inner);

  // AOS-faithful reveal: pure opacity fade-in.
  revealOnScroll(inner);
}
