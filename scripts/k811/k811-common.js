/*
 * Shared runtime for the kotak811 (k811-*) blocks.
 *
 * - Marks <main> with `.kotak811` so the scoped design guide (styles/kotak811.css)
 *   applies only to these migrated pages.
 * - Loads the design guide + Manrope once.
 * - Premium scroll-reveal motion (see the "Scroll-reveal motion" section below):
 *   a single IntersectionObserver reveals each section ONCE as it enters the
 *   viewport. Its content children fade + rise (opacity 0->1, translateY 40->0)
 *   staggered by 0.15s; images additionally scale 0.95->1; numeric stat values
 *   count up. All motion is transform/opacity only, gated on `.k811-aos-ready`
 *   (added only by JS, so a JS failure leaves content visible), and disabled
 *   under `prefers-reduced-motion`.
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

// ---- Scroll-reveal motion -----------------------------------------------
// A single IntersectionObserver reveals each registered section ONCE as it
// enters the viewport, then unobserves it so it never re-hides or re-animates.
//
// We deliberately do NOT use a heavy animation library (GSAP/AOS): the whole
// effect is CSS transitions on transform + opacity (compositor-only, no layout
// thrash), driven by a ~2KB observer. The hidden state is gated on the
// `.k811-aos-ready` class (added ONLY by JS), so if JS ever fails to run the
// content simply stays visible rather than stuck invisible.
//
// On reveal, the section gets `.k811-aos-in`, which cascades to:
//   - staggered children  (`[data-k811-child]`, delay = index * 0.15s)
//   - image scale-up       (`.k811-aos-img`, scale .95 -> 1)
//   - number counters      (`[data-k811-count]`, animated in JS below)

// Honour prefers-reduced-motion: when set, we skip all hidden/animated states
// and just mark everything revealed so content shows instantly.
const prefersReducedMotion = () => typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const STAGGER_STEP = 0.15; // seconds between consecutive child reveals

// Collect the "content pieces" of a section that should stagger in. Blocks
// rebuild their own DOM in decorate(), so the meaningful pieces are each
// block's direct children (story image/text, pillar tabs, team cards, …).
// Sections with only default content stagger that wrapper's direct children.
function collectStaggerTargets(section) {
  const blocks = [...section.querySelectorAll('.block')];
  if (blocks.length) {
    return blocks.flatMap((b) => [...b.children]);
  }
  const wrapper = section.querySelector(':scope > div');
  return wrapper ? [...wrapper.children] : [];
}

// Tag a section's content pieces for the staggered reveal and its images for
// the scale-up. Deferred to the next frame (see registerReveal) so blocks have
// finished rebuilding their DOM. Idempotent via the data-k811-staggered guard.
function tagSectionContent(section) {
  if (section.dataset.k811Staggered) return;
  section.dataset.k811Staggered = '1';
  collectStaggerTargets(section).forEach((child, i) => {
    child.setAttribute('data-k811-child', '');
    // Per-child delay consumed by the CSS transition-delay.
    child.style.setProperty('--k811-child-delay', `${i * STAGGER_STEP}s`);
  });
  section.querySelectorAll('img').forEach((img) => img.classList.add('k811-aos-img'));
}

// ---- Number counters ------------------------------------------------------
// Any element marked `data-k811-count` animates from 0 to its numeric text
// value when its section reveals. Non-digit characters (₹, %, +, commas) are
// preserved as a prefix/suffix around the animated number.
function parseCounter(el) {
  const raw = (el.textContent || '').trim();
  const match = raw.match(/-?[\d,]*\.?\d+/);
  if (!match) return null;
  const numStr = match[0];
  const decimals = (numStr.split('.')[1] || '').length;
  return {
    target: parseFloat(numStr.replace(/,/g, '')),
    decimals,
    grouped: numStr.includes(','),
    prefix: raw.slice(0, match.index),
    suffix: raw.slice(match.index + numStr.length),
  };
}

function formatCount(value, meta) {
  const fixed = value.toFixed(meta.decimals);
  const grouped = meta.grouped
    ? Number(fixed).toLocaleString('en-IN', {
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    })
    : fixed;
  return `${meta.prefix}${grouped}${meta.suffix}`;
}

function animateCounter(el) {
  if (el.dataset.k811CountDone) return;
  const meta = parseCounter(el);
  if (!meta) return;
  el.dataset.k811CountDone = '1';
  if (prefersReducedMotion()) { el.textContent = formatCount(meta.target, meta); return; }
  const DURATION = 1600; // ms, roughly twice the section fade for a premium feel
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / DURATION);
    // easeOutCubic for a decelerating count
    const eased = 1 - (1 - t) ** 3;
    el.textContent = formatCount(meta.target * eased, meta);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = formatCount(meta.target, meta);
  };
  requestAnimationFrame(tick);
}

function reveal(section) {
  section.classList.add('k811-aos-in');
  section.querySelectorAll('[data-k811-count]').forEach(animateCounter);
}

let observer;
function getObserver() {
  if (observer) return observer;
  if (typeof IntersectionObserver === 'undefined') return null;
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target); // animate once, then stop watching
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
  return observer;
}

// Failsafe: the IntersectionObserver can miss elements that are already in the
// viewport when the observer starts (scroll restoration, back/forward cache,
// fast client-side nav, momentum scroll). Those elements would stay stuck
// hidden and render as blank sections. On scroll/resize/load, reveal any
// registered-but-hidden element whose top has entered the viewport.
let sweepBound = false;
function sweepInViewport() {
  const vh = window.innerHeight || document.documentElement.clientHeight;
  document.querySelectorAll('.k811-aos-ready:not(.k811-aos-in)').forEach((el) => {
    if (el.getBoundingClientRect().top < vh * 0.92) reveal(el);
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
 * Register an element (or elements) for the scroll reveal. Resolves each target
 * to its enclosing `.section` so the whole section reveals as one unit, with
 * its children staggering in. Each section animates once, then stays visible.
 * @param {Element|Element[]} targets
 */
export function revealOnScroll(targets) {
  const seen = new Set();
  const list = (Array.isArray(targets) ? targets : [targets])
    .filter(Boolean)
    .map((el) => (el.closest && el.closest('.section')) || el)
    .filter((el) => (seen.has(el) ? false : seen.add(el)));

  // Reduced motion: reveal immediately with no hidden state and no transitions.
  if (prefersReducedMotion()) {
    list.forEach((el) => {
      el.setAttribute('data-k811-aos', 'fade-in');
      reveal(el);
    });
    return;
  }

  const io = getObserver();
  list.forEach((el) => {
    el.setAttribute('data-k811-aos', 'fade-in');
    if (io) {
      el.classList.add('k811-aos-ready');
      // Tag the staggered children + images on the NEXT frame, after the block
      // has finished rebuilding its DOM in decorate(). The section itself is
      // already hidden via `.k811-aos-ready`, so there's no flash of unstaggered
      // content.
      requestAnimationFrame(() => {
        tagSectionContent(el);
        // If already in the viewport at register time (e.g. the hero on page
        // load), reveal on the following frame so the hidden state paints first
        // and the fade + rise transition actually plays (a proper on-load
        // fade-in rather than an instant snap).
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (r.top < vh * 0.92) requestAnimationFrame(() => reveal(el));
      });
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
