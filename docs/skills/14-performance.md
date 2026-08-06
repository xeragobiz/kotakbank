# 14 · Performance

## Purpose
Keep pages at Lighthouse/PSI **100** by protecting LCP, splitting work correctly across the three phases, and shipping minimal, optimized assets. Follow aem.live "Keeping it 100".

## When to use
- Any block/page change that affects markup, CSS, JS, images, or fonts.
- Before opening a PR (PSI is a merge gate).
- Investigating an LCP / CLS / TBT regression.

## Best practices
- **Protect LCP:** eager phase does the minimum. Use `createOptimizedPicture`; for the LCP/art-directed image use the `k811-hero` preload pattern (media-scoped `<link rel=preload>`). Only the LCP image gets `fetchpriority="high"`/`loading="eager"`; everything else `loading="lazy"`.
- **Split work:** martech and non-critical JS go in `delayed.js`; the rest of the page/header/footer in lazy.
- **CSS discipline:** LCP-critical rules in `styles.css`; the rest in `lazy-styles.css`; block CSS auto code-splits per block.
- **JS discipline:** no unnecessary dependencies (every KB ships); rely on per-block code splitting; prefer the ~2KB IntersectionObserver reveal over animation libraries.
- **Animations:** transform/opacity only (compositor-friendly); honor `prefers-reduced-motion`.
- **Assets:** optimize + size-check all committed images/fonts/icons; subset fonts.
- **Measure:** run PSI on the feature preview URL before/after; avoid layout thrash and long tasks.

## Anti-patterns
- ❌ Eager-loading non-LCP images, or lazy-loading the LCP image.
- ❌ Putting non-critical CSS in `styles.css` or non-critical JS in the eager path.
- ❌ Adding a heavy animation/util library for something the shared observer handles.
- ❌ Animating layout properties (width/top/left) → jank + CLS.
- ❌ Committing unoptimized assets; large blocking fetches on the eager path.

## Examples
```js
// LCP image preload pattern (k811-hero style), media-scoped
const link = document.createElement('link');
link.rel = 'preload';
link.as = 'image';
link.href = lcpSrc;
link.media = '(min-width: 900px)';
document.head.append(link);
```
```css
@media (prefers-reduced-motion: no-preference) {
    .k811-example { opacity: 0; transform: translateY(16px); transition: opacity .4s, transform .4s; }
    .k811-example.revealed { opacity: 1; transform: none; }
}
```

## Validation checklist
- [ ] Eager phase minimal; lazy/delayed split correct (`delayed.js` for martech).
- [ ] LCP image eager + `fetchpriority="high"` (+ preload if art-directed); others lazy.
- [ ] LCP-critical CSS only in `styles.css`; rest in `lazy-styles.css`.
- [ ] No unnecessary dependencies; shared reveal preferred over libs.
- [ ] Animations transform/opacity only; `prefers-reduced-motion` honored.
- [ ] Assets optimized/subset; PSI run on the preview URL, targeting 100.
