/*
 * Shared runtime for the kotak811 (k811-*) blocks.
 *
 * - Marks <main> with `.kotak811` so the scoped design guide (styles/kotak811.css)
 *   applies only to these migrated pages.
 * - Loads the design guide + Manrope once.
 * - Scroll reveal uses the real AOS library (self-hosted scripts/k811/aos.js +
 *   aos.css), initialised with the source site's config (fade / 400ms /
 *   ease-in / once:false). A lightweight IntersectionObserver stands in as a
 *   failsafe only if AOS fails to load, so content can never stay hidden.
 */

let stylesLoaded = false;

function loadDesignGuide() {
  if (stylesLoaded) return;
  stylesLoaded = true;
  const main = document.querySelector('main');
  if (main) main.classList.add('kotak811');
  if (!document.querySelector('link[data-k811-styles]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles/kotak811.css';
    link.setAttribute('data-k811-styles', '');
    document.head.append(link);
  }
}

// ---- Scroll reveal (IntersectionObserver) -------------------------------
// A pure opacity fade-in (matching the source's AOS "fade" effect) driven by a
// single IntersectionObserver. We deliberately do NOT use the AOS library: its
// stylesheet sets `opacity:0` unconditionally on every `[data-aos]` element and
// relies on scroll events to reveal them, which misfires on mobile (momentum
// scroll, restored scroll position, no-scroll captures) and left below-the-fold
// feature/promo sections stuck transparent — rendering as blank/black boxes.
//
// The IntersectionObserver is reliable on mobile and reveals each element once,
// then stops observing so content is never re-hidden. The hidden state is gated
// on `.k811-aos-ready` (added here by JS), so if JS ever fails to run the
// content simply stays visible (opacity 1) rather than invisible.
let observer;
function getObserver() {
  if (observer) return observer;
  if (typeof IntersectionObserver === 'undefined') return null;
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('k811-aos-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
  return observer;
}

// Failsafe: the IntersectionObserver can miss elements that are already in the
// viewport when the observer starts (scroll restoration, back/forward cache,
// fast client-side nav, momentum scroll). Those elements would stay stuck at
// opacity:0 and render as blank sections. On scroll/resize/load, reveal any
// registered-but-hidden element whose top has entered the viewport.
let sweepBound = false;
function sweepInViewport() {
  const vh = window.innerHeight || document.documentElement.clientHeight;
  document.querySelectorAll('.k811-aos-ready:not(.k811-aos-in)').forEach((el) => {
    if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add('k811-aos-in');
  });
}
function bindSweep() {
  if (sweepBound) return;
  sweepBound = true;
  const opts = { passive: true };
  window.addEventListener('scroll', sweepInViewport, opts);
  window.addEventListener('resize', sweepInViewport, opts);
  window.addEventListener('load', sweepInViewport, opts);
  window.addEventListener('pageshow', sweepInViewport, opts);
}

/**
 * Register an element (or elements) for the fade-in reveal. Each element fades
 * in once when it scrolls into view and then stays visible.
 * @param {Element|Element[]} targets
 */
export function revealOnScroll(targets) {
  // The fade unit is the whole section: resolve every target up to its
  // enclosing `.section` so each section reveals as one block on scroll.
  // Multiple blocks in the same section dedupe to a single registration.
  const seen = new Set();
  const list = (Array.isArray(targets) ? targets : [targets])
    .filter(Boolean)
    .map((el) => (el.closest && el.closest('.section')) || el)
    .filter((el) => (seen.has(el) ? false : seen.add(el)));
  const io = getObserver();
  list.forEach((el) => {
    el.setAttribute('data-k811-aos', 'fade-in');
    if (io) {
      el.classList.add('k811-aos-ready');
      // If already in (or above) the viewport at register time, reveal
      // immediately so first-paint / above-the-fold content is never hidden.
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.92) el.classList.add('k811-aos-in');
      io.observe(el);
    }
  });
  bindSweep();
}

/**
 * Standard init every k811 block calls first.
 * @param {Element} block
 */
export function initK811(block) {
  loadDesignGuide();
  block.classList.add('k811-block');
  // Fade the whole enclosing section in on scroll, so every k811 block's
  // section reveals as a unit — even blocks that don't call revealOnScroll.
  revealOnScroll(block);
}

/**
 * Lazily mount a looping, autoplaying Lottie animation (decorative).
 * Loads the lottie-player web component on demand so it never blocks LCP.
 * @param {Element} container where the player is appended
 * @param {string} src Lottie JSON url
 */
export async function mountLottie(container, src) {
  if (!src || !container) return;
  if (!customElements.get('lottie-player')) {
    await import('./lottie-player.min.js').catch(() => {});
  }
  const player = document.createElement('lottie-player');
  player.classList.add('k811-lottie');
  player.setAttribute('src', src);
  player.setAttribute('background', 'transparent');
  player.setAttribute('speed', '1');
  player.setAttribute('loop', '');
  player.setAttribute('autoplay', '');
  container.append(player);
}
