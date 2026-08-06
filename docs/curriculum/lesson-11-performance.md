# Lesson 11 — Performance Engineering ("Keeping it 100")

> Tier 4 · Performance, Quality & Delivery · Prerequisites: Lessons 06–07

## 1. Theory

EDS's headline promise is **Lighthouse/PageSpeed 100**. This isn't a vanity metric — it's a design constraint the whole architecture serves. Performance in EDS is governed by **Core Web Vitals**:

- **LCP (Largest Contentful Paint)** — when the biggest above-the-fold element paints. Target **< 2.5s**. Dominated by the hero image/text and the critical path.
- **CLS (Cumulative Layout Shift)** — visual stability. Target **< 0.1**. Caused by images without dimensions, late-loading fonts, injected content pushing layout.
- **INP (Interaction to Next Paint)** — responsiveness to input. Target **< 200ms**. Hurt by long main-thread tasks (usually third-party JS).

The Adobe doctrine is **[Keeping it 100](https://www.aem.live/developer/keeping-it-100)**: you *start* at 100 and defend it, rather than optimizing a slow site later.

## 2. Architecture — the levers

```
LCP  ← eager phase discipline + LCP image preload + createOptimizedPicture + fonts
CLS  ← explicit width/height on images, font-display strategy, no layout-shifting injects
INP  ← martech in delayed.js, small main-thread tasks, compositor-only animations
Payload ← per-block code-split JS/CSS, minimal deps, subset fonts, optimized assets
```

Key platform tools:
- **`createOptimizedPicture(src, alt, eager, breakpoints)`** (from `aem.js`) — emits a responsive `<picture>` with the edge's on-the-fly image optimization (WebP, correct sizes).
- **Three-phase loading** (Lesson 07) — the master LCP/INP lever.
- **`.aem.page`/`.aem.live` + PSI** — measure on the real preview URL, not localhost.

## 3. Engineering rationale

**Why obsess over LCP?** It's the strongest proxy for "does this feel fast," is a Google ranking signal, and is the metric EDS's whole eager/lazy split exists to protect. A single mis-phased 200KB script can drop a 100 to the 70s.

**Why preload the LCP image specifically?** The browser discovers a JS-built or CSS-background image *late*. A `<link rel=preload as=image>` (media-scoped for art direction) tells it to fetch immediately, shaving hundreds of ms off LCP.

**Why `createOptimizedPicture` instead of a raw `<img>`?** It generates multiple sources at the right widths in modern formats, served through the edge's image pipeline — dramatically smaller bytes with correct `width`/`height` (which also prevents CLS). Hand-rolling this is error-prone.

**Why explicit image dimensions?** Without them the browser reserves no space; when the image loads it shoves content down → CLS spike. Intrinsic `width`/`height` (or `aspect-ratio`) reserve the box.

**Why compositor-only animations?** `transform`/`opacity` run on the GPU compositor without layout/paint, keeping the main thread free (good INP) and avoiding jank. Animating `width`/`top` forces layout every frame.

**The core trade-off:** performance discipline constrains what you can do in the eager phase and how much JS you ship. On content/marketing sites this is exactly the right constraint; if a page genuinely needs a heavy client app, that's an architectural decision to isolate (Lesson 16), not to sprinkle everywhere.

## 4. Examples

**LCP image, done right:**
```js
import { createOptimizedPicture } from '../../scripts/aem.js';
// eager=true only for the LCP image
const pic = createOptimizedPicture(src, alt, true, [
  { media: '(min-width: 900px)', width: '1600' },
  { width: '750' },
]);
pic.querySelector('img').setAttribute('fetchpriority', 'high');
block.append(pic);

// and preload it from decorate() so it's discovered immediately
const link = Object.assign(document.createElement('link'),
  { rel: 'preload', as: 'image', href: src, fetchPriority: 'high' });
document.head.appendChild(link);
```

**Everything else, lazy:**
```js
const pic = createOptimizedPicture(src, alt, false, [{ width: '750' }]);
pic.querySelector('img').loading = 'lazy';
```

**CLS-safe font loading (in CSS):**
```css
@font-face { font-family: 'Manrope'; src: url('/fonts/manrope.woff2') format('woff2');
  font-display: swap; }   /* or optional; pair with a metrics-matched fallback */
```

## 5. Hands-on exercises

1. **Diagnose.** A page scores LCP 4.1s. The hero image is a CSS `background-image`. List two fixes and expected impact.
2. **Preload.** Add a media-scoped LCP preload for a responsive hero and explain the `media` attribute.
3. **CLS hunt.** Given a card grid that jumps as images load, identify the missing attributes and fix them.
4. **INP.** A page's INP is 380ms; analytics loads in `scripts.js`. Describe the fix and why it helps INP.
5. **Measure.** Run PSI against a `*.aem.page` preview URL, record LCP/CLS/INP, make one change, and re-measure.

## 6. Common mistakes

- **Third-party JS on the critical path** (eager/lazy instead of delayed).
- **Raw `<img>` without dimensions** → CLS.
- **CSS background images for the LCP element** (undiscoverable → late LCP).
- **Not preloading the LCP image.**
- **Measuring only on localhost**, not the edge preview where the real image pipeline runs.
- **Heavy animation libraries** where a ~2KB IntersectionObserver would do.

## 7. Review questions

1. Define LCP, CLS, INP and their target thresholds.
2. Why preload the LCP image, and why media-scope the preload?
3. What does `createOptimizedPicture` give you that a raw `<img>` doesn't?
4. Name two causes of CLS and their fixes.
5. Why do compositor-only animations protect INP?

## 8. Best practices

- **Start at 100 and defend it**; measure on the preview URL every PR.
- **Eager = first section + LCP preload only**; martech in `delayed.js`.
- **`createOptimizedPicture` everywhere**; `fetchpriority=high`/`eager` only on LCP, `lazy` elsewhere.
- **Always set image dimensions / aspect-ratio.**
- **Subset and self-host fonts**; use a metrics-matched fallback + sensible `font-display`.
- **Prefer the ~2KB IntersectionObserver reveal** over animation libraries.

## 9. Anti-patterns

- **"Optimize later."** EDS is fast by default; regressions come from additions.
- **Bundling a framework/animation lib** for a marketing page.
- **Layout-triggering animations** (`top`/`width`/`height`).
- **Un-dimensioned, unoptimized images.**
- **Trusting a green localhost Lighthouse** while the edge tells a different story.

---

**Next:** [Lesson 12 — Accessibility & Progressive Enhancement →](lesson-12-accessibility.md)
