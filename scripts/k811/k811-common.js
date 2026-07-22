/*
 * Shared runtime for the kotak811 (k811-*) blocks.
 *
 * - Marks <main> with `.kotak811` so the scoped design guide (styles/kotak811.css)
 *   applies only to these migrated pages.
 * - Loads the design guide + Manrope once.
 * - Provides an AOS-faithful "fade-in" reveal (pure opacity, 400ms ease-in,
 *   re-triggers on scroll into view) matching the source site's AOS config.
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

// Single shared observer: re-triggers (matches AOS `once: false`).
let observer;
function getObserver() {
  if (observer) return observer;
  if (typeof IntersectionObserver === 'undefined') return null;
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('k811-aos-in', entry.isIntersecting);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
  return observer;
}

/**
 * Register an element (or elements) for the fade-in reveal.
 * @param {Element|Element[]} targets
 */
export function revealOnScroll(targets) {
  const list = Array.isArray(targets) ? targets : [targets];
  const io = getObserver();
  list.forEach((el) => {
    if (!el) return;
    el.setAttribute('data-k811-aos', 'fade-in');
    if (io) {
      el.classList.add('k811-aos-ready');
      io.observe(el);
    }
    // no observer -> element stays visible (no ready class, no hidden state)
  });
}

/**
 * Standard init every k811 block calls first.
 * @param {Element} block
 */
export function initK811(block) {
  loadDesignGuide();
  block.classList.add('k811-block');
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
