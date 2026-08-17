import { initK811 } from '../../scripts/k811/k811-common.js';

/*
 * K811 Video Hero — full-bleed autoplaying background video with overlaid
 * heading / subtext / CTA(s). Used by the Infinity Metal and About Us pages.
 *
 * Content model (rows, in order; any may be omitted):
 *   1. videoDesktop  — a cell whose only content is the desktop .mp4 URL
 *   2. videoMobile   — (optional) a cell whose only content is the mobile .mp4 URL
 *   3. poster        — (optional) a cell with a <picture>/<img> poster image
 *   4. text          — heading(s) + optional paragraph (the overlay copy)
 *   5+ CTA link cells — 1st = primary, subsequent = inline/secondary links
 *
 * Performance: the poster image renders immediately as the LCP candidate; the
 * <video> is attached lazily (muted/playsinline) only once the hero nears the
 * viewport, so it never blocks LCP or the PageSpeed budget.
 *
 * Playback: matches the source — the clip plays ONCE (no loop) each time the
 * hero scrolls into view and pauses when it leaves, rather than looping forever.
 * Re-entering the section restarts it from the first frame.
 */

// Match absolute (https://…), root-relative (/content/dam/…) and ./-relative
// video URLs — AEM rewrites CDN links to DAM paths on the published site.
const URL_RE = /^(https?:\/\/|\.?\/)\S+\.(mp4|webm|mov)(\?\S*)?$/i;

function cellText(c) {
  return (c.textContent || '').trim();
}

function attachVideo(media, desktopSrc, mobileSrc, posterSrc) {
  const video = document.createElement('video');
  video.className = 'k811-video-hero-video';
  video.muted = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'none');
  if (posterSrc) video.setAttribute('poster', posterSrc);

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

  // Play once (no loop) each time the hero enters the viewport; pause on leave.
  // Matches the source, where the clip rests on its last frame after playing
  // and restarts from the top when scrolled back into view.
  const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tryPlay = () => {
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };
  if (!motionOK) return; // reduced-motion: leave paused on the poster/first frame

  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          try { video.currentTime = 0; } catch (e) { /* not seekable yet */ }
          tryPlay();
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.25 });
    io.observe(media);
  } else {
    tryPlay();
  }
}

export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r);

  // Classify cells by content.
  const videoUrls = [];
  let posterCell = null;
  let copyCell = null;
  const linkCells = [];

  // A video cell's content is one or more .mp4/.webm/.mov URLs (desktop first,
  // optional mobile second). The URLs may be authored as separate cells OR
  // stacked as multiple lines/paragraphs in a single richtext cell, and the
  // authoring system may auto-wrap a bare URL in an <a>. Collect every URL we
  // find, in document order, from anchors and from plain-text lines.
  const urlsInCell = (c) => {
    const found = [];
    c.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href').trim();
      if (URL_RE.test(href)) found.push(href);
    });
    // plain-text lines (e.g. two <p>s each holding a bare URL)
    (c.querySelectorAll('p').length ? [...c.querySelectorAll('p')] : [c])
      .forEach((el) => {
        const t = (el.textContent || '').trim();
        if (URL_RE.test(t) && !found.includes(t)) found.push(t);
      });
    return found;
  };

  cells.forEach((c) => {
    const txt = cellText(c);
    const hasPicture = !!c.querySelector('picture, img');
    const found = urlsInCell(c);
    if (found.length) {
      found.forEach((u) => videoUrls.push(u));
    } else if (c.querySelector('a')) {
      linkCells.push(c);
    } else if (hasPicture && !posterCell) {
      posterCell = c;
    } else if (txt && c.querySelector('h1, h2, h3, h4, p') && !copyCell) {
      copyCell = c;
    }
  });

  const [desktopSrc = '', mobileSrc = ''] = videoUrls;

  // Media layer (poster + lazy video)
  const media = document.createElement('div');
  media.className = 'k811-video-hero-media';
  let posterSrc = '';
  if (posterCell) {
    const pic = posterCell.querySelector('picture');
    const img = posterCell.querySelector('img');
    if (img) posterSrc = img.getAttribute('src') || '';
    if (pic) media.append(pic);
    else if (img) media.append(img);
  }

  // Content overlay
  const content = document.createElement('div');
  content.className = 'k811-video-hero-content';
  if (copyCell) {
    while (copyCell.firstChild) content.append(copyCell.firstChild);
  }
  if (linkCells.length) {
    const actions = document.createElement('div');
    actions.className = 'k811-video-hero-actions';
    linkCells.forEach((c, i) => {
      const link = c.querySelector('a');
      if (!link) return;
      link.classList.add('k811-video-hero-btn');
      link.classList.add(i === 0 ? 'k811-video-hero-btn-primary' : 'k811-video-hero-btn-secondary');
      // keep any sibling label text (e.g. "Existing customer?") before the link
      const label = cellText(c).replace(link.textContent.trim(), '').trim();
      if (label && i > 0) {
        const span = document.createElement('span');
        span.className = 'k811-video-hero-btn-label';
        span.textContent = label;
        actions.append(span);
      }
      actions.append(link);
    });
    content.append(actions);
  }

  block.textContent = '';
  // Matches the source layout: text block on the solid dark background first,
  // then the video band below it (NOT a full-bleed video behind the copy).
  block.append(content, media);

  // Lazy-attach the video once the hero nears the viewport (protects LCP).
  if (desktopSrc || mobileSrc) {
    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            attachVideo(media, desktopSrc, mobileSrc, posterSrc);
            obs.disconnect();
          }
        });
      }, { rootMargin: '200px' });
      io.observe(block);
    } else {
      attachVideo(media, desktopSrc, mobileSrc, posterSrc);
    }
  }
}
