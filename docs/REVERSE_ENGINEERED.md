# Reverse-Engineered Reference

Extracted **from the actual source** (not from convention), so a new assistant can work with minimal hallucination. Every signature, export, token, and count below was read from the code on the `k811-page-migration` branch. When in doubt, re-verify against the file cited — do not invent APIs.

> **Stack:** AEM Edge Delivery Services (xwalk). Vanilla JS/CSS/JSON. No Java/HTL/OSGi/SCSS/Dispatcher/Cloud-Manager. Sections requesting those are answered with what the repo *actually* has.

---

## 1. Repository map (verified)
```
blocks/       50 blocks (see §4 inventory in docs/REPOSITORY_MAP.md)
scripts/      aem.js (core, DO NOT EDIT), scripts.js, delayed.js, sentry.js,
              dompurify.min.js, eligibility-modal.js, compare-modal.js, credit-card.js,
              editor-support.js, editor-support-rte.js, k811/{k811-common.js, aos.*, lottie-player.min.js}
styles/       styles.css (global+LCP), lazy-styles.css, fonts.css, kotak811.css, eligibility-modal.css
models/       _component-{models,definition,filters}.json + _page/_section/_text/_title/_image/_button.json
content/      authored HTML snapshots — DO NOT hand-edit
tools/importer/  parsers/, transformers/, page-templates.json, bundles, dist/
head.html · fstab.yaml · helix-query.yaml · helix-sitemap.yaml · .hlxignore
component-{definition,models,filters}.json  GENERATED — never hand-edit
.github/workflows/  main.yaml, cleanup-on-create.yaml
```
Full touch matrix + block inventory: `docs/REPOSITORY_MAP.md`. Diagrams + flows: `docs/ARCHITECTURE.md`.

---

## 2. Architecture (verified essentials)
- **Delivery:** `fstab.yaml` mounts `https://author-p165370-e1760075.adobeaemcloud.com/bin/franklin.delivery/xeragobiz/kotakbank/main`, `type: markup`.
- **Entry:** `head.html` eager-loads (with `nonce="aem"`) `/scripts/aem.js`, `/scripts/scripts.js`, `/styles/styles.css`; CSP is `script-src 'nonce-aem' 'strict-dynamic' 'unsafe-inline' http: https:; base-uri 'self'; object-src 'none'`.
- **Three-phase `loadPage()`** (`scripts/scripts.js:186`): `loadEager(document)` → `loadLazy(document)` → `loadDelayed()`.
  - `loadEager` (`:129`): `decorateMain(main)` → `loadSection(first section, waitForFirstImage)` → fonts.
  - `loadLazy` (`:153`): `loadSections(main)` → header/footer → `lazy-styles.css`.
  - `loadDelayed` (`:180`): dynamic-imports `delayed.js`.
- **CI** (`.github/workflows/main.yaml`): `npm ci` → `npm run lint` → `npm run build:json` then `git diff --exit-code` on the three aggregates (fails if stale).

---

## 3. Coding standards (as enforced by config)
- **ESLint:** `airbnb-base` + `plugin:import` + `plugin:json` + `plugin:xwalk`. Lint cmd: `eslint . --ext .json,.js,.mjs`. → `.js` import extensions required; Unix LF; `no-param-reassign` allows mutating param properties.
- **Stylelint:** `stylelint-config-standard` over `blocks/**/*.css` + `styles/*.css`.
- Indent: 2-space JS, 4-space CSS. JSDoc on exported/`decorate` functions (the code does this consistently).
- Full narrative: `docs/CODING_STANDARDS.md`.

---

## 4. Component (block) patterns — verified from code

### Canonical block shape (`blocks/{name}/{name}.js`)
Default export `decorate(block)`. Real example — `blocks/k811-hero/k811-hero.js`:
```js
import { createOptimizedPicture } from '../../scripts/aem.js';
import openEligibilityModal from '../../scripts/eligibility-modal.js';
import { initK811 } from '../../scripts/k811/k811-common.js';

export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r);
  // classify cells by CONTENT, not index:
  const isPictureOnly = (c) => c.querySelector('picture')
    && !c.querySelector('a, h1, h2, h3, h4, h5, h6, ul, ol') && !c.textContent.trim();
  const linkCells = cells.filter((c) => !imageCells.includes(c) && c.querySelector('a'));
  // ...builds art-directed <picture>, preloads WebP, wires CTA to openEligibilityModal
}
```
**Observed conventions (real, repo-wide):**
- **Cell classification predicates** (picture-only / link / copy / heading) — never `cells[n]` by index. Confirmed in `k811-hero.js:53-68`.
- **Variant via class tokens**: block reads leading text tokens and does `block.classList.add(token)` (`k811-hero.js:95`); CSS keys off e.g. `.k811-hero.detail`, `.k811-hero-heading-{color}`.
- **17 blocks** import `initK811`; **22 blocks** use `createOptimizedPicture` (grep-verified).

### Dialog / authoring model (`blocks/{name}/_{name}.json`)
Real example — `blocks/k811-feature/_k811-feature.json`:
```json
{
  "definitions": [{
    "title": "K811 Feature", "id": "k811-feature",
    "plugins": { "xwalk": { "page": {
      "resourceType": "core/franklin/components/block/v1/block",
      "template": { "name": "K811 Feature", "model": "k811-feature" }
    }}}
  }],
  "models": [{
    "id": "k811-feature",
    "fields": [
      { "component": "reference", "valueType": "string", "name": "image", "label": "Video Thumbnail", "multi": false },
      { "component": "richtext", "name": "text", "value": "", "label": "Text", "valueType": "string" },
      { "component": "text", "valueType": "string", "name": "video", "label": "Video Link (URL)" }
    ]
  }],
  "filters": []
}
```
Pattern: `definitions[].plugins.xwalk.page.resourceType = core/franklin/components/block/v1/block`; `models[].fields[]` with `component` ∈ {`reference`, `richtext`, `text`, `select`, `aem-content`}, each with `name`, `label`, `valueType`. `filters` often `[]`. After editing → `npm run build:json`.

---

## 5. Existing reusable utilities — `scripts/aem.js` (DO NOT EDIT)
Verified exports (`scripts/aem.js:688`). Use these; do not reimplement:
| Export | Purpose |
|---|---|
| `createOptimizedPicture(src, alt, eager, breakpoints)` | responsive WebP `<picture>` (`:324`) |
| `buildBlock(blockName, content)` | programmatic block DOM (`:520`) |
| `decorateBlock` / `decorateBlocks` | mark blocks for loading (`:587`/`:605`) |
| `loadBlock(block)` | load a block's JS+CSS (`:550`) |
| `decorateSections(main)` | section decoration (`:477`) |
| `loadSection(section, cb)` / `loadSections(el)` | phase loading (`:655`/`:675`) |
| `loadHeader` / `loadFooter` | nav/footer (`:614`/`:626`) |
| `decorateIcons(el, prefix)` | SVG icon spans (`:466`) |
| `decorateButtons` | *(note: lives in scripts.js, not aem.js)* |
| `decorateTemplateAndTheme()` | template/theme body classes (`:375`) |
| `readBlockConfig(block)` | key/value config from block rows (`:220`) |
| `getMetadata(name, doc)` | `<meta>` lookup (`:308`) |
| `loadCSS(href)` / `loadScript(src, attrs)` | async asset loads (`:262`/`:282`) |
| `toClassName(name)` / `toCamelCase(name)` | string→class / →camel (`:195`/`:210`) |
| `wrapTextNodes(block)` | wrap bare text (`:391`) |
| `waitForFirstImage(section)` | LCP image await (`:637`) |
| `sampleRUM(checkpoint, data)` | RUM telemetry (`:14`) |

### `scripts/scripts.js` exports
| Export | Purpose |
|---|---|
| `decorateMain(main)` (`:117`) | full main decoration (auto-blocks, buttons, icons, sections, blocks) |
| `decorateButtons(main)` (`:77`) | wrap links as `.button` |
| `moveInstrumentation(from, to)` (`:38`) | **preserve Universal Editor overlays when moving nodes** |
| `moveAttributes(from, to, attrs)` (`:19`) | attribute copy helper |

---

## 6. Common services (shared ES modules) — verified exports
There are no OSGi services. The shared "services" are:
| Module | Exports | Notes |
|---|---|---|
| `scripts/k811/k811-common.js` | `initK811(block)` (`:223`), `revealOnScroll(targets)` (`:178`), `mountLottie(container, src)` (`:237`) | k811 runtime: marks `main.kotak811`, loads `kotak811.css`+Manrope once, single `IntersectionObserver` scroll-reveal (staggered children, counter animation, `prefers-reduced-motion` fallback), on-demand Lottie |
| `scripts/eligibility-modal.js` | default `openEligibilityModal(applyHref)` (`:23`) | shared modal; used by `k811-hero`, `sticky-cta`, `cc-steps`, `cc-hero` |
| `scripts/compare-modal.js` | default `openCompareModal(card, pool)` (`:154`) | compare modal |
| `scripts/credit-card.js` | `loadCreditCard(path)` (`:86`), `isCardReference(row)` (`:109`), `cardReferencePath(row)` (`:127`) | credit-card reference resolution |
| `scripts/dompurify.min.js` | DOMPurify | sanitize before `innerHTML` |
| `scripts/sentry.js` | default `initSentry()` | error monitoring; called from `delayed.js` |
| `scripts/delayed.js` | (side-effect) | `initSentry()` + site-wide "Back to Top" control (no authoring, mobile-only, delayed phase) |

---

## 7. Existing Sling Models → *N/A — none exist*
There are **no Sling Models** (no Java). The equivalent is the per-block `decorate(block)` (§4) reading delivered DOM. Cross-block logic lives in the §6 modules. See `docs/skills/02-sling-models.md`.

---

## 8. Common dialogs → *Universal Editor models (`_{block}.json`)*
There are **no Granite/Coral `cq:dialog`s**. Authoring UI = the `_{block}.json` models (§4). Field components in use across the repo: `reference` (assets), `richtext`, `text`, `select`, `aem-content`. Default-content models: `models/_page.json`, `_section.json`, `_text.json`, `_title.json`, `_image.json`, `_button.json`. See `docs/skills/12-universal-editor.md`.

---

## 9. Dispatcher rules → *N/A — Edge CDN + `.hlxignore`*
There is **no Dispatcher**. Serving control = `.hlxignore` (verified contents: `.*`, `*.md`, `karma.config.js`, `LICENSE`, `package.json`, `package-lock.json`, `test/*`, `_*`, `snapshots/*`). Security headers = `head.html` CSP. "Invalidation" = re-publish (push). See `docs/skills/05-dispatcher.md`.

---

## 10. Authoring conventions (verified)
- One block per folder; lowercase-hyphenated; migration blocks prefixed `k811-`.
- Model fields carry author-friendly `label`s (e.g. "Video Thumbnail", "Video Link (URL)") — not raw field names.
- **Variants are class tokens** read from leading authored text and CSS-keyed (`.k811-hero.detail`), not separate blocks.
- Content is authored in Universal Editor and delivered via `fstab`; `content/*.plain.html` are reference snapshots only.
- After any `_*.json` change: `npm run build:json`; CI enforces aggregate freshness.

---

## 11. Performance patterns (verified from code)
- **LCP preload:** `k811-hero.js:16 preloadPicture()` emits media-scoped `<link rel="preload" as="image" type="image/webp" imagesrcset=… fetchpriority="high">` for the hero's WebP sources; the LCP `<img>` gets `fetchpriority="high"` (`:133`).
- **Eager minimalism:** only the first section loads eagerly (`scripts.js:136`); everything else lazy/delayed.
- **Reveal without libs:** `k811-common.js` uses a single `IntersectionObserver`; motion is transform/opacity only, gated on `.k811-aos-ready`/`.k811-aos-in`, with a `prefers-reduced-motion` fast-path and a viewport "sweep" failsafe so nothing stays hidden.
- **Delayed niceties:** "Back to Top" is built in `delayed.js` so it never affects LCP.
- **On-demand Lottie:** `mountLottie` dynamic-imports the player only when needed.
- Targets: PSI 100 on the preview URL. See `docs/skills/14-performance.md`.

---

## 12. Security patterns (verified)
- Strict CSP in `head.html`; all first-party scripts carry `nonce="aem"`.
- `scripts/dompurify.min.js` present for sanitizing injected HTML.
- Only runtime dependency: `@sentry/browser` (via `scripts/sentry.js`, initialized in the delayed phase — no PII/secrets).
- Public repo → no secrets committed; git/DA auth via Settings opt-in, never in-band. See `docs/skills/16-security.md`.

---

## 13. Testing strategy (verified reality)
- **No unit-test runner wired into CI.** CI = `npm run lint` + the JSON-sync `git diff` gate only (`main.yaml`). `.hlxignore` lists `karma.config.js` and `test/*` (legacy boilerplate), but there is no test job.
- **Practical testing** = lint + browser verification: `aem-cli up`, inspect `…plain.html`, Playwright MCP `snapshot`/`evaluate` (screenshot only for pixel QA), at mobile/tablet/desktop; content/visual parity for migration. See `docs/skills/17-testing.md` and `docs/PR_CHECKLIST.md`.

---

## 14. Deployment process (verified)
- Push feature branch → **GitHub Actions** (`main.yaml`) runs lint + JSON-sync gate → **AEM Code Sync** publishes to `https://{branch}--kotakbank--xeragobiz.aem.page/`.
- PSI on the preview (target 100) → PR to `main` **with a preview-URL link (mandatory)** → merge → Code Sync publishes `main--kotakbank--xeragobiz.aem.{page,live}`.
- No manual deploy, no Cloud Manager, no packages. Sequence diagrams: `docs/ARCHITECTURE.md` §11–12.

---

## Design tokens (from `styles/kotak811.css`, applied under `main.kotak811`)
`--k811-font: manrope` · `--k811-text:#222` · `--k811-bg:#fff` · `--k811-dark-bg:#000` · `--k811-link:#d1101f` (brand red) · `--k811-card-radius:20px` · `--k811-content-max:1120px` · `--k811-section-pad-y:48px` · `--k811-fade-duration:800ms` · `--k811-fade-easing:cubic-bezier(0.22,0.61,0.36,1)`. Reuse these; don't hardcode equivalents.

---

## How to use this doc to avoid hallucinating
1. **Need a utility?** Check §5/§6 first — the export exists or it doesn't; don't invent one or reimplement `createOptimizedPicture`/`moveInstrumentation`.
2. **Writing a block?** Copy the §4 pattern: `decorate(block)`, classify cells by content, variants as class tokens, `initK811` for k811.
3. **Asked for Java/HTL/Sling/OSGi/Dispatcher/Cloud-Manager?** §7–9 say they don't exist — map to the EDS equivalent.
4. **Styling k811?** Use the design tokens above, not magic numbers.
5. **Unsure an API exists?** Re-read the cited file:line before writing code against it.
