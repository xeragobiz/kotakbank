# 08 · Assets → `reference` field + `createOptimizedPicture` (mapping skill)

> **There is no DAM UI / asset workflows / renditions engine you administer here.** Images are referenced from content and delivered/optimized by the Edge platform. Committed assets in the repo (`icons/`, `fonts/`) must be optimized by hand before commit.

## Purpose
Explain how images, icons, and fonts are handled in EDS: authored images come through the `reference` field and are rendered with `createOptimizedPicture`; repo assets are optimized, subsetted, and committed.

## When to use
- Adding/optimizing images in a block; handling responsive/art-directed images; the LCP image.
- Adding an icon or font.

## Mapping
| Assets/DAM concept | EDS equivalent |
|---|---|
| DAM asset picker | `reference` field in `_{block}.json` (image/asset) |
| Renditions / smart crop | `createOptimizedPicture` from `aem.js` (responsive `<picture>`) |
| Asset workflows (metadata, processing) | Optimize before commit; platform serves optimized variants |
| Art direction | Media-scoped `<source>` / `<link rel=preload>` (the `k811-hero` pattern) |
| Icon library | `icons/` SVGs |
| Font management | `fonts/` (subset) + `styles/fonts.css` `@font-face` |

## Best practices
- Use `createOptimizedPicture` for authored images — never hand-write raw `<img src>` for content images.
- Set `loading="lazy"` on below-the-fold images; only the LCP image gets `fetchpriority="high"` / `loading="eager"`.
- For the LCP / art-directed image, follow the `k811-hero` preload pattern: media-scoped `<link rel=preload>` for the JS-built LCP image.
- Always provide meaningful `alt` text (see [15](15-accessibility.md)).
- Commit only optimized, size-checked assets; subset fonts.

## Anti-patterns
- ❌ Committing unoptimized/oversized images, fonts, or icons (everything in git is public and served).
- ❌ Eager-loading non-LCP images or lazy-loading the LCP image.
- ❌ Bare `<img>` for content images instead of `createOptimizedPicture`.
- ❌ Missing/empty `alt` on meaningful images.

## Examples
```js
import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  block.querySelectorAll('img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 900px)', width: '1200' },
      { width: '750' },
    ]);
    img.closest('picture')?.replaceWith(optimized);
  });
}
```

## Validation checklist
- [ ] Authored images rendered via `createOptimizedPicture`.
- [ ] LCP image eager + `fetchpriority="high"` (+ preload if art-directed); others `loading="lazy"`.
- [ ] All meaningful images have `alt`; decorative images empty `alt`.
- [ ] Committed images/fonts/icons optimized and size-checked; fonts subset.
- [ ] Rendering verified at mobile/tablet/desktop.
