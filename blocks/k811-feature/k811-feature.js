import { moveInstrumentation } from '../../scripts/scripts.js';
import { initK811, revealOnScroll, mountLottie } from '../../scripts/k811/k811-common.js';

// shared counter so consecutive feature promos alternate image side
let featureIndex = 0;

export default function decorate(block) {
  initK811(block);
  block.classList.add('k811-feature-2-cols');

  // alternate image left/right down the page (0 = image left, 1 = image right)
  if (featureIndex % 2 === 1) block.classList.add('k811-feature-alt');
  featureIndex += 1;

  // Collect the leaf content cell of every field row. Empty fields may not
  // produce rows, so identify each cell by its content rather than position.
  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r).filter(Boolean);

  const pictureCell = cells.find((c) => c.querySelector('picture'));
  // the video cell's ENTIRE content is a single URL (EDS wraps it as
  // <p><a>url</a></p>, so test the text, not the markup)
  const isUrlOnly = (c) => {
    const t = (c.textContent || '').trim();
    return t.length > 0 && !/\s/.test(t) && /^https?:\/\/\S+$/.test(t);
  };
  const videoCell = cells.find((c) => c !== pictureCell && isUrlOnly(c));
  // the text cell is the remaining non-empty cell (heading + description)
  const textCell = cells.find((c) => c !== pictureCell && c !== videoCell
    && (c.textContent || '').trim());

  // resolve the video URL from either a link href or the plain text
  let videoHref = '';
  if (videoCell) {
    const a = videoCell.querySelector('a');
    videoHref = a ? a.getAttribute('href') : videoCell.textContent.trim();
  }

  // media column: thumbnail wrapped in the video link (play overlay via CSS)
  const media = document.createElement('div');
  media.className = 'k811-feature-img-col';
  const picture = pictureCell ? pictureCell.querySelector('picture') : null;
  if (picture) {
    // a stray URL must not remain as the img alt
    const img = picture.querySelector('img');
    if (img && /^https?:\/\//.test((img.getAttribute('alt') || '').trim())) img.setAttribute('alt', '');
    if (videoHref) {
      const link = document.createElement('a');
      link.href = videoHref;
      link.setAttribute('aria-label', 'Play video');
      link.append(picture);
      media.append(link);
    } else {
      media.append(picture);
    }
  }

  // text column: the rich body (heading + description)
  const text = document.createElement('div');
  text.className = 'k811-feature-text-col';
  if (textCell) {
    while (textCell.firstChild) text.append(textCell.firstChild);
  }

  const newRow = document.createElement('div');
  moveInstrumentation(rows[0] || block, newRow);
  newRow.append(media, text);

  block.textContent = '';
  block.append(newRow);

  // QR / app-download variant: the image is a small square (QR code) rather
  // than a wide hero photo. Flag it so CSS keeps it compact and centered.
  const qrImg = picture ? picture.querySelector('img') : null;
  const w = qrImg ? Number(qrImg.getAttribute('width')) : 0;
  const h = qrImg ? Number(qrImg.getAttribute('height')) : 0;
  const looksSquare = w && h && Math.abs(w - h) / Math.max(w, h) < 0.2;
  const hasDownloadCta = /download/i.test(text.textContent || '');
  if (looksSquare || (hasDownloadCta && block.querySelectorAll('h2').length > 1)) {
    block.classList.add('k811-feature-qr');
  }

  // Decorative Lottie animation: only when an author explicitly provides a
  // trailing plain <p> whose text is a Lottie JSON url. Lazy-mounted into the
  // media column so it never blocks LCP.
  const lottieP = [...text.querySelectorAll('p')].find((p) => {
    const t = (p.textContent || '').trim();
    return /^https?:\/\/\S+\.json$/i.test(t) && !p.querySelector('a');
  });
  if (lottieP) {
    const lottieSrc = lottieP.textContent.trim();
    lottieP.remove();
    block.classList.add('k811-feature-has-lottie');
    mountLottie(media, lottieSrc);
  }

  // AOS-faithful reveal: pure opacity fade-in, 400ms ease-in, re-triggers on
  // scroll into view (matches the source site's AOS config exactly).
  revealOnScroll(block);
}
