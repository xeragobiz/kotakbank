# 05 · Optimize Performance 🟢

**Purpose:** Improve Lighthouse/PSI toward 100 on an EDS page or block.

## Variables
- `{{TARGET}}` — page path or block, e.g. `/index` or `blocks/k811-hero`
- `{{PREVIEW_URL}}` — `https://{{BRANCH}}--kotakbank--xeragobiz.aem.page/{{PATH}}`
- `{{METRIC}}` — the failing metric(s): LCP / CLS / TBT / total (optional)
- `{{PSI_OUTPUT}}` — paste PSI findings (optional)

## Prompt
```
Optimize performance for {{TARGET}} toward PSI 100. Failing metric(s): {{METRIC}}.
PSI findings: {{PSI_OUTPUT}}
Preview URL to measure against: {{PREVIEW_URL}}

Apply this repo's performance discipline (docs/skills/14-performance.md, "Keeping it 100"):
1. Protect LCP: eager phase does the minimum. Ensure the LCP image uses createOptimizedPicture and the k811-hero
   preload pattern (media-scoped <link rel=preload as=image>), with fetchpriority="high"/loading="eager" ONLY on it;
   every other image loading="lazy".
2. Phase split: move non-critical JS/martech to delayed.js; header/footer/rest to lazy. Nothing extra in eager.
3. CSS: keep only global + LCP-critical rules in styles/styles.css; push the rest to lazy-styles.css.
4. JS: remove unnecessary dependencies; prefer the ~2KB shared IntersectionObserver over animation libraries.
5. Animations: transform/opacity only; add prefers-reduced-motion guards. Kill layout-thrashing animations (width/top/left) to fix CLS.
6. Assets: confirm images/fonts/icons are optimized and subset.

Measure with PSI on {{PREVIEW_URL}} before and after; report the delta per metric. Then run `npm run lint`.
Do not regress accessibility or content parity.
```

## Validation
- [ ] LCP image eager/preloaded; others lazy.
- [ ] Eager phase lean; martech in delayed.js; critical vs lazy CSS correct.
- [ ] No unnecessary deps; animations compositor-friendly + reduced-motion.
- [ ] PSI improved on the preview URL; lint passes; no a11y/parity regression.
