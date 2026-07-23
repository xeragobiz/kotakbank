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
  // the video/lottie cell's ENTIRE content is a single URL (EDS wraps it as
  // <p><a>url</a></p>, so test the text, not the markup). Match absolute
  // (https://…) AND root-relative (/blocks/…json, /content/…) single-token
  // paths so a Lottie path authored in its own cell isn't mistaken for the
  // text cell (which would drop the heading + description).
  const isUrlOnly = (c) => {
    const t = (c.textContent || '').trim();
    return t.length > 0 && !/\s/.test(t) && /^(?:https?:\/\/|\/)\S+$/.test(t);
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
  let picture = pictureCell ? pictureCell.querySelector('picture') : null;
  // A Lottie-only feature (e.g. the security section) has no poster image; the
  // Lottie JSON path lands in the image field and renders as a broken
  // <img src="....json">. Detect that, drop the broken picture, and use the
  // path as the Lottie source instead.
  let lottieFromImage = '';
  if (picture) {
    const pImg = picture.querySelector('img');
    const pSrc = (pImg && (pImg.getAttribute('src') || '')).trim();
    if (/\.json(\?|$)/i.test(pSrc)) {
      lottieFromImage = pSrc;
      picture.remove();
      picture = null;
    }
  }
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

  // QR / app-download variant: a genuinely square QR image (e.g. 3000x3000)
  // plus the download-app copy. The QR is exactly 1:1 — use a tight tolerance
  // so near-square product-card renders (e.g. 2240x1960 debit card) are NOT
  // misclassified as QR (which would force the centered column layout).
  // The download-app promo has the distinctive copy "Download the app" +
  // "Download your bank" (two headings). This signal is reliable in both the
  // deployed and import environments (unlike the QR image's width/height, which
  // the importer strips). Near-square product-card photos must NOT match.
  const hasDownloadCopy = /download/i.test(text.textContent || '')
    && block.querySelectorAll('h2').length > 1;
  if (hasDownloadCopy) {
    block.classList.add('k811-feature-qr');
  }

  // Decorative Lottie animation. The Lottie JSON path may arrive as: a plain
  // <p> with the url as text, an auto-linked <p><a href="....json">, the video
  // field, or the image field (see lottieFromImage above). Match a .json in the
  // paragraph text OR an anchor href, from the text column, and remove that
  // paragraph so the raw url never renders as a visible link. Lazy-mounted into
  // the media column so it never blocks LCP.
  const JSON_RE = /(?:https?:\/\/\S+|\/\S+)\.json(?:\?\S*)?$/i;
  let lottieFromText = '';
  const lottieP = [...text.querySelectorAll('p')].find((p) => {
    const t = (p.textContent || '').trim();
    const a = p.querySelector('a');
    const href = a ? (a.getAttribute('href') || '').trim() : '';
    return JSON_RE.test(t) || JSON_RE.test(href);
  });
  if (lottieP) {
    const a = lottieP.querySelector('a');
    lottieFromText = (a && JSON_RE.test((a.getAttribute('href') || '').trim()))
      ? a.getAttribute('href').trim()
      : lottieP.textContent.trim();
    lottieP.remove();
  }
  // the video field may also carry a .json Lottie path (JCR generation path)
  const lottieFromVideo = JSON_RE.test(videoHref) ? videoHref : '';
  const lottieSrc = lottieFromText || lottieFromVideo || lottieFromImage;
  if (lottieSrc) {
    block.classList.add('k811-feature-has-lottie');
    // The "Next-gen security" logo Lottie is a doubly-nested precomp that our
    // bundled lottie-player can't render inside this block (blank output). The
    // source shows it essentially static, so render the equivalent static SVG
    // logo instead. Match both the local path (security*.json) and the authored
    // CloudFront asset id (lf30_cbskvcfq…) used on the live/deployed content.
    // Other feature Lotties (flat) still animate via mountLottie.
    if (/security[^/]*\.json(\?|$)/i.test(lottieSrc) || /lf30_cbskvcfq/i.test(lottieSrc)) {
      const img = document.createElement('img');
      img.src = '/blocks/k811-feature/security-logo.svg';
      img.alt = '';
      img.loading = 'lazy';
      img.className = 'k811-feature-logo';
      media.append(img);
    } else {
      mountLottie(media, lottieSrc);
    }
  }

  // AOS-faithful reveal: pure opacity fade-in, 400ms ease-in, re-triggers on
  // scroll into view (matches the source site's AOS config exactly).
  revealOnScroll(block);
}
