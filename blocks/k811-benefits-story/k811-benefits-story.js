import { initK811 } from '../../scripts/k811/k811-common.js';

/*
 * k811-benefits-story — scroll-driven "shrinking photo" benefit panels, matching
 * the Infinity Metal "exclusive offers" section on kotak811.bank.in.
 *
 * Each authored row is one 100vh panel:
 *   cell 1 (image) — a <picture> with an art-directed desktop <img> and an
 *                    optional mobile <source media="(max-width: 899px)">.
 *   cell 2 (text)  — a heading + short paragraph, shown on the left.
 *
 * Behaviour (desktop): the photo starts full-bleed (covers the whole panel) and,
 * as the panel scrolls through the viewport, shrinks/rounds into a card on the
 * right while the left text is revealed on the white background. Driven by a
 * scroll-progress value fed to CSS custom properties (`--k811-bs-progress`).
 * Honours prefers-reduced-motion (jumps straight to the rested card state).
 */

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];
  const panels = [];

  rows.forEach((row, i) => {
    row.classList.add('k811-benefits-story-panel');
    // Alternate the photo side each row (odd rows mirror: photo left, text
    // right) to match the source's zig-zag layout.
    if (i % 2 === 1) row.classList.add('k811-benefits-story-panel-reverse');
    const cells = [...row.children];
    const mediaCell = cells.find((c) => c.querySelector('picture, img')) || cells[0];
    const textCell = cells.find((c) => c !== mediaCell && c.querySelector('h1, h2, h3, h4, p'))
      || cells[cells.length - 1];

    if (mediaCell) mediaCell.classList.add('k811-benefits-story-media');
    if (textCell) textCell.classList.add('k811-benefits-story-content');
    panels.push(row);
  });

  const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Forward-only progress, driven by the deepest scroll position the user has
  // reached (maxScrollY) rather than a per-panel latch. maxScrollY is a plain
  // scalar tied to user scroll, so — unlike a cached progress value — it can't
  // be poisoned by the transient wrong geometry that occurs while the sections
  // above this block are still laying out during page load (which previously
  // froze the reveal at progress 1 on mobile). Progress is recomputed fresh
  // every frame, so a bad reading self-corrects on the next frame.
  let maxScrollY = window.scrollY;

  // Progress model: as a panel travels from entering the viewport bottom to
  // reaching the top, progress goes 0 -> 1. Evaluated at the panel's position
  // when the page was scrolled to maxScrollY, so scrolling down advances it and
  // scrolling back up holds it (no reverse). Drives the media shrink/round
  // (desktop) and the content + media slide/fade-in (all sizes).
  // Reduced-motion users jump straight to the rested state (progress = 1).
  function update() {
    const vh = window.innerHeight;
    if (window.scrollY > maxScrollY) maxScrollY = window.scrollY;
    const held = maxScrollY - window.scrollY; // how far above the deepest point we are
    panels.forEach((panel) => {
      if (!motionOK) { panel.style.setProperty('--k811-bs-progress', '1'); return; }
      const r = panel.getBoundingClientRect();
      // Animate over the first ~60% of the panel's travel so it settles early.
      // Subtract `held` so the value reflects the deepest scroll reached.
      const progress = clamp((vh - (r.top - held)) / (vh * 0.9), 0, 1);
      panel.style.setProperty('--k811-bs-progress', progress.toFixed(4));
    });
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Recompute after layout settles (next frame + window load) so the initial
  // render uses correct geometry once the sections above have laid out.
  update();
  requestAnimationFrame(update);
  if (document.readyState !== 'complete') window.addEventListener('load', update, { once: true });
}
