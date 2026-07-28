import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * K811 CF Media — renders a DAM image referenced through a Content Fragment.
 *
 * Problem this solves: a DAM image referenced directly via a Universal Editor
 * reference field is delivered as an EDS-optimized `./media_<hash>` reference
 * and renders fine. The SAME image referenced *through a Content Fragment*
 * (especially when the CF is delivered as JSON/GraphQL) arrives as a raw DAM
 * path or an author-absolute URL, which the EDS media pipeline never rewrites —
 * so it renders broken or unoptimized.
 *
 * Fix (block-side normalization): take whatever URL the CF handed us and turn
 * it into a resolvable src, then run it through createOptimizedPicture so it
 * flows through the EDS media bus like every other image.
 *
 * Content contract (rows in model order):
 *   1. image        — the CF-referenced DAM image (reference field OR a cell
 *                     whose text/href is a DAM path / author URL)
 *   2. imageAlt      — alt text (optional)
 *   3. caption       — richtext caption shown under the image (optional)
 */

// EDS-optimized references are already correct — leave them untouched.
const isOptimizedRef = (src) => /(^|\/)media_[0-9a-f]+/i.test(src);

/**
 * Normalize whatever the CF gave us into a src the EDS host can serve.
 * - keeps `./media_xxx` optimized references as-is
 * - strips an author/publish host so an absolute author URL becomes a
 *   root-relative DAM path served from the current (EDS) origin
 * @param {string} raw
 * @returns {string|null}
 */
export function normalizeDamSrc(raw) {
  if (!raw) return null;
  const src = raw.trim();
  if (!src) return null;
  if (isOptimizedRef(src)) return src;
  // Absolute URL (author/publish/DM host) → keep only the path so it resolves
  // against the EDS delivery origin. A true Dynamic Media delivery URL (with
  // its own optimization params) has a query string — preserve it verbatim.
  try {
    const u = new URL(src, window.location.href);
    if (u.search) return u.href; // DM / already-parameterized delivery URL
    return u.pathname;
  } catch (e) {
    return src;
  }
}

// createOptimizedPicture appends ?width=&format= params that only yield an
// optimized result when the host honors them AND the path ends in a real image
// extension. If neither holds (e.g. a bare DAM path, or a DM URL that already
// carries its own params), skip re-optimization and render a plain <img>.
const hasImageExt = (src) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(src);

export default function decorate(block) {
  initK811(block);

  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r).filter(Boolean);

  // image cell: a real <img>/<picture>, else a cell whose text/href is a URL/path
  const imgEl = block.querySelector('img');
  const linkEl = block.querySelector('a');
  const pathCell = cells.find((c) => {
    const t = (c.textContent || '').trim();
    return !c.querySelector('img, picture') && /^(?:https?:\/\/|\/)\S+$/.test(t);
  });

  let raw = '';
  if (imgEl) raw = imgEl.getAttribute('src');
  else if (linkEl) raw = linkEl.getAttribute('href');
  else if (pathCell) raw = pathCell.textContent.trim();

  const src = normalizeDamSrc(raw);

  // alt + caption: remaining text cells that aren't the image/path cell
  const imageCell = imgEl ? imgEl.closest('div') : pathCell;
  const textCells = cells.filter((c) => c !== imageCell && (c.textContent || '').trim());
  const alt = (imgEl && imgEl.getAttribute('alt'))
    || (textCells[0] ? textCells[0].textContent.trim() : '');
  const captionCell = textCells.find((c) => c.querySelector('p, h1, h2, h3, h4, h5, h6'))
    || (textCells[0] && textCells[0] !== undefined ? textCells[1] : null);

  const figure = document.createElement('figure');
  figure.className = 'k811-cf-media-figure';

  if (src) {
    let media;
    if (hasImageExt(src) && !isOptimizedRef(src)) {
      // safe to route through the EDS media bus for format/size optimization
      media = createOptimizedPicture(src, alt, false, [{ width: '1600' }]);
    } else {
      // optimized ref, DM URL with own params, or extension-less path → plain img
      const picture = document.createElement('picture');
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt;
      img.loading = 'lazy';
      picture.append(img);
      media = picture;
    }
    figure.append(media);
  }

  if (captionCell && captionCell.textContent.trim()) {
    const caption = document.createElement('figcaption');
    caption.className = 'k811-cf-media-caption';
    while (captionCell.firstChild) caption.append(captionCell.firstChild);
    figure.append(caption);
  }

  block.replaceChildren(figure);
  revealOnScroll(block);
}
