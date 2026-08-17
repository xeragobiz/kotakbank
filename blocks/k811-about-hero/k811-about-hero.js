import { initK811 } from '../../scripts/k811/k811-common.js';

/*
 * K811 About Hero — the About Us banner from kotak811.bank.in/about-us.
 * A full-bleed, looping, muted background video sits behind a centered dark
 * heading on a light (dotted) background. Distinct from k811-video-hero (which
 * stacks a dark text band above the video); here the copy is OVERLAID on the
 * video and the section reads as one light banner.
 *
 * Content model (rows, in order; any may be omitted):
 *   1. video  — a richtext cell with the desktop .mp4 URL, then an optional
 *               mobile .mp4 URL (one per line / paragraph).
 *   2. text   — the heading (h1) overlaid on the video.
 *
 * Performance: the <video> is attached lazily (muted/loop/playsinline) only
 * once the hero nears the viewport, so it never blocks LCP.
 */

// Absolute (https://…), root-relative (/content/dam/…) or ./-relative video URL.
const URL_RE = /^(https?:\/\/|\.?\/)\S+\.(mp4|webm|mov)(\?\S*)?$/i;

function attachVideo(media, desktopSrc, mobileSrc) {
  const video = document.createElement('video');
  video.className = 'k811-about-hero-video';
  video.muted = true;
  video.loop = true;
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'none');

  // Art-directed sources: mobile first (max-width), then desktop.
  if (mobileSrc) {
    const s = document.createElement('source');
    s.setAttribute('src', mobileSrc);
    s.setAttribute('type', 'video/mp4');
    s.setAttribute('media', '(max-width: 899px)');
    video.append(s);
  }
  if (desktopSrc) {
    const s = document.createElement('source');
    s.setAttribute('src', desktopSrc);
    s.setAttribute('type', 'video/mp4');
    video.append(s);
  }
  media.append(video);

  // Loop + autoplay behind the copy (matches the source). Honour reduced-motion.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const p = video.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r);

  // Collect video URLs (anchors or plain-text lines) and the heading/copy cell.
  const videoUrls = [];
  let copyCell = null;

  const urlsInCell = (c) => {
    const found = [];
    c.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href').trim();
      if (URL_RE.test(href)) found.push(href);
    });
    (c.querySelectorAll('p').length ? [...c.querySelectorAll('p')] : [c])
      .forEach((el) => {
        const t = (el.textContent || '').trim();
        if (URL_RE.test(t) && !found.includes(t)) found.push(t);
      });
    return found;
  };

  cells.forEach((c) => {
    const found = urlsInCell(c);
    if (found.length) {
      found.forEach((u) => videoUrls.push(u));
    } else if ((c.textContent || '').trim() && c.querySelector('h1, h2, h3, p') && !copyCell) {
      copyCell = c;
    }
  });

  const [desktopSrc = '', mobileSrc = ''] = videoUrls;

  // Full-bleed media layer (video sits behind the copy).
  const media = document.createElement('div');
  media.className = 'k811-about-hero-media';

  // Centered heading overlay.
  const content = document.createElement('div');
  content.className = 'k811-about-hero-content';
  if (copyCell) {
    while (copyCell.firstChild) content.append(copyCell.firstChild);
  }

  block.textContent = '';
  block.append(media, content);

  // Lazy-attach the video once the hero nears the viewport (protects LCP).
  if (desktopSrc || mobileSrc) {
    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            attachVideo(media, desktopSrc, mobileSrc);
            obs.disconnect();
          }
        });
      }, { rootMargin: '200px' });
      io.observe(block);
    } else {
      attachVideo(media, desktopSrc, mobileSrc);
    }
  }
}
