# 04 · Loading & Performance (incl. Caching & Image Optimization)

Target **Lighthouse/PSI 100** ("Keeping it 100"). EDS is fast by default; this chapter is about not regressing it.

## Lazy loading
- **Recommendation:** everything not needed for LCP loads lazily — sections beyond the first, header/footer, `lazy-styles.css`, and all non-LCP images (`loading="lazy"`).
  **Why:** the eager phase defines the critical path ([01](01-architecture-and-runtime.md)). Anything loaded there that LCP doesn't need directly delays LCP. Lazy is the default; eager is the exception you justify.
- **Recommendation:** martech/analytics/chat go in the delayed phase (`delayed.js`).
  **Why:** these are third-party, heavy, and never LCP-critical. The delayed phase runs after the page is interactive, so they cost the user nothing on the critical path. Dumping them into eager is the #1 cause of EDS performance regressions.

## Protecting LCP
- **Recommendation:** identify the LCP element per template (usually the hero image); render it eagerly with `fetchpriority="high"` and `loading="eager"`, and **preload** it with a media-scoped `<link rel="preload" as="image">` (the hero pattern).
  **Why:** the browser's preload scanner can't see a JS-built image until the script runs; a media-scoped preload lets it fetch exactly one art-directed source immediately, shaving the largest chunk off LCP. `fetchpriority="high"` tells the browser this image beats other downloads.
- **Recommendation:** only the LCP image gets eager treatment; everything else is lazy.
  **Why:** eager-loading multiple images contends for bandwidth and *delays* the one that matters.

## Image optimization
- **Recommendation:** render authored images with `createOptimizedPicture` from `aem.js`.
  **Why:** it emits a responsive `<picture>` with WebP sources at multiple widths; the edge serves the smallest suitable variant. Hand-written `<img>` ships one oversized file to every device.
- **Recommendation:** provide breakpoints matched to the layout; set `alt` always.
  **Why:** right-sized images cut bytes; `alt` is accessibility + SEO (and required, see [05](05-accessibility.md)).
- **Recommendation:** commit only optimized, size-checked assets; subset fonts.
  **Why:** the repo is public and served as-is; an unoptimized 2MB PNG or full-weight font family is shipped verbatim.

## JS/CSS weight discipline
- **Recommendation:** no unnecessary dependencies; rely on per-block code-splitting; prefer the shared IntersectionObserver reveal.
  **Why:** per-block splitting means a page only downloads the CSS/JS for blocks it uses; a global dependency defeats that by loading on every page.

## Caching
- **Recommendation:** rely on the Edge CDN; to "invalidate," re-publish (push). Control what's served via `.hlxignore`; control headers via `head.html`.
  **Why:** there is no Dispatcher/TTL to tune. The platform caches HTML at the edge on first miss and refreshes on publish. Trying to hand-manage caching fights the platform; the correct mental model is "publish = invalidate."
- **Recommendation:** keep the eager asset set small and stable.
  **Why:** cached, code-split, edge-served assets are only fast if the eager path is lean; a bloated eager path is slow even when cached.

## Measurement
- **Recommendation:** run PSI on the feature preview URL before/after; verify LCP ≤2.5s, CLS ≤0.1, healthy INP at mobile/tablet/desktop.
  **Why:** "looks fast" isn't a metric. PSI on the *preview* (not localhost) reflects real edge delivery. Measuring at three widths catches mobile-specific regressions (the constrained, majority case).

## Validation checklist — performance
- [ ] Only LCP-critical work in eager; martech in delayed.
- [ ] LCP image eager + `fetchpriority="high"` + preloaded; all others `loading="lazy"`.
- [ ] Images via `createOptimizedPicture` with layout-matched breakpoints; assets optimized; fonts subset.
- [ ] Critical vs lazy CSS split; no unnecessary dependencies.
- [ ] PSI run on preview (target 100); CWV within thresholds at 3 widths.
