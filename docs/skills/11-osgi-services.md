# 11 · OSGi Services → ES modules + YAML config (mapping skill)

> **This repo has no OSGi container.** There are no bundles, `@Component`/`@Service`, `@Designate` config, `@Reference` injection, or the Felix console. Shared logic and configuration are plain ES modules and YAML/HTML files.

## Purpose
Explain where "services" and "configuration" live in EDS. Cross-cutting logic is shared via ES modules in `scripts/`; configuration lives in `fstab.yaml`, `helix-query.yaml`, `helix-sitemap.yaml`, `head.html`, and `.hlxignore`.

## When to use
- When asked to "create an OSGi service / config" → use the mappings below.
- When you need shared behavior across blocks, or need to change a config surface.

## Mapping
| OSGi concept | EDS equivalent |
|---|---|
| `@Component` service | An ES module in `scripts/` (e.g. `k811/k811-common.js`) |
| `@Reference` injection | `import` with explicit `.js` extension |
| OSGi config (`@Designate`) | `fstab.yaml`, `helix-query.yaml`, `helix-sitemap.yaml`, `head.html` |
| Config Admin / run modes | Branch/env config + `head.html`; preview vs live URLs |
| System bundle / core | `scripts/aem.js` — **never modify** |
| Event handler / listener | `IntersectionObserver` / DOM event listeners in modules |

## Best practices
- Factor shared logic into small, dependency-free ES modules (the `k811-common.js` runtime is the model: `initK811`, shared reveal observer).
- Import with explicit `.js` extensions; keep modules tree-shakeable-by-hand.
- Treat `fstab.yaml`/`helix-*.yaml`/`head.html`/`.hlxignore` as the config surface; change them deliberately.
- **Never modify `scripts/aem.js`** — it is the platform core.

## Anti-patterns
- ❌ Introducing OSGi bundles / `@Component` / Felix config.
- ❌ Duplicating shared logic across blocks instead of a `scripts/` module.
- ❌ Editing `scripts/aem.js`.
- ❌ Adding heavy dependencies to emulate a "service layer".

## Examples
```js
// scripts/k811/k811-common.js — the "service" other blocks consume
export function initK811(block) {
  document.querySelector('main')?.classList.add('kotak811');
  loadDesignGuideOnce();       // loads styles/kotak811.css + Manrope once
  registerReveal(block);       // shared IntersectionObserver scroll-reveal
}

// In a block:
import { initK811 } from '../../scripts/k811/k811-common.js';
```

## Validation checklist
- [ ] No OSGi bundle / component / config artifacts.
- [ ] Shared logic in a `scripts/` ES module; `.js` import extensions; no heavy deps.
- [ ] Config changes confined to `fstab.yaml`/`helix-*.yaml`/`head.html`/`.hlxignore`.
- [ ] `scripts/aem.js` untouched.
