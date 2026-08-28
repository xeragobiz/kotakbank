# Coding Standards — kotakbank (AEM Edge Delivery Services)

Authoritative coding standards for this repository. Where a requested topic belongs to the *traditional* AEMaaCS stack (Java, HTL, Dialogs, OSGi, DI, annotations), it is marked **N/A here** and mapped to its EDS equivalent — never introduce those artifacts (see `AGENTS.md` and `.cursor/rules/`). Optional **block SCSS** is a local compile step only — see [§5](#5-scss).

> **Stack reality:** This is an **AEM Edge Delivery Services** project — vanilla **JavaScript (ES6+), CSS3, JSON**, authored via Universal Editor, served via AEM Code Sync. Optional block SCSS compiles to CSS locally (`npm run build:css`). No Java, Maven, OSGi, Sling, HTL, or Dispatcher.

## Contents
1. [Java](#1-java) · 2. [HTL](#2-htl) · 3. [JavaScript](#3-javascript) · 4. [CSS](#4-css) · 5. [SCSS](#5-scss) · 6. [Dialogs](#6-dialogs) · 7. [Naming conventions](#7-naming-conventions) · 8. [Package / repository structure](#8-package--repository-structure) · 9. [Logging](#9-logging) · 10. [Exception handling](#10-exception-handling) · 11. [Dependency injection](#11-dependency-injection) · 12. [OSGi configuration](#12-osgi-configuration) · 13. [Annotations](#13-annotations) · 14. [Performance](#14-performance) · 15. [Accessibility](#15-accessibility) · 16. [Security](#16-security) · 17. [Code review checklist](#17-code-review-checklist)

---

## 1. Java
**N/A here — do not introduce Java.** No `.java`, `pom.xml`, `core/` bundle, `ui.apps`/`ui.content`, or `.content.xml`.

**EDS equivalent:** component logic lives in a block's default-exported `decorate(block)` in `blocks/{name}/{name}.js`; shared logic in ES modules under `scripts/`. If a task genuinely needs Java, it is the wrong repository — say so instead of scaffolding it.

---

## 2. HTL
**N/A here — no HTL/Sightly runtime.** No `.html` component templates, no `data-sly-*`.

**EDS equivalent:** the AEM Edge backend emits semantic HTML; presentation logic is JavaScript DOM decoration.
- `data-sly-list` → iterate `block.children`.
- `data-sly-test` → guard clauses.
- HTL context escaping → sanitize authored/remote HTML with `scripts/dompurify.min.js` before any `innerHTML`; prefer building nodes over string concatenation.
- Read delivered markup first: `curl http://localhost:3000/path.plain.html`.

---

## 3. JavaScript
First-class. **ES6+ modules, Airbnb base ESLint.** No TypeScript, no bundler, no transpiling — code ships as authored.

**Rules**
- **Always include the `.js` extension in imports:** `import { x } from '../../scripts/aem.js';`.
- **Unix LF** line endings; **2-space indent**.
- `no-param-reassign`: mutating a param's **properties** is allowed (blocks mutate `block`); reassigning the param itself is not.
- **JSDoc every exported / `decorate` function.** Match existing block density.
- Prefer `const`/`let`, arrow functions, destructuring, spread, template literals, optional chaining.
- Each block exports a default `async function decorate(block)`.
- **Classify block cells by content, not fixed index** (Universal Editor field-collapsing changes cell counts): picture-only → image, richtext → copy, `<a>` → CTA.
- Decoration must be **idempotent** and **defensive** (tolerate missing/extra/reordered cells; never throw on a null cell).
- Use `createOptimizedPicture` from `aem.js` for images; `moveInstrumentation()` when moving nodes (preserve UE overlays).
- k811-* blocks call `initK811(block)` from `scripts/k811/k811-common.js` first; reuse the shared IntersectionObserver reveal — **no animation libraries**.
- **No new runtime dependencies without justification** — every KB ships to the browser.
- **Never modify `scripts/aem.js`** (platform core).

**Anti-patterns:** missing `.js` in imports · CRLF · reading `cells[2]` by index · non-idempotent decoration · adding a heavy dependency for something native handles · editing `aem.js`.

```js
import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811 } from '../../scripts/k811/k811-common.js';

/**
 * Decorates the k811-example block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  initK811(block);
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture') && !cell.textContent.trim()) cell.classList.add('k811-example-media');
      else if (cell.querySelector('a')) cell.classList.add('k811-example-cta');
      else cell.classList.add('k811-example-copy');
    });
  });
}
```

---

## 4. CSS
First-class. **CSS3, Stylelint standard config, 4-space indent.**

**Rules**
- **Mobile-first:** base styles, then `min-width` media queries at **600 / 900 / 1200px**.
- **Scope every selector to the block:** `.k811-hero .cta` ✅ — bare `.cta` ❌.
- **Never** use `.{block}-container` or `.{block}-wrapper` selectors — those belong to sections.
- Modern CSS: Grid, Flexbox, custom properties. k811-* blocks inherit tokens from `styles/kotak811.css` (scoped under `main.kotak811`).
- **Animations: transform / opacity only** (compositor-friendly); always wrap in `@media (prefers-reduced-motion: no-preference)`.
- Keep `styles/styles.css` to global + LCP-critical rules; the rest goes in `styles/lazy-styles.css`; block CSS auto code-splits per block.

**Anti-patterns:** bare/`-container`/`-wrapper` selectors · desktop-first · animating layout properties (width/top/left) → CLS · dumping block CSS into `styles.css`.

```css
.k811-example { display: grid; gap: 1rem; }
.k811-example .k811-example-cta a { display: inline-block; }
@media (min-width: 900px) {
    .k811-example { grid-template-columns: 1fr 1fr; }
}
@media (prefers-reduced-motion: no-preference) {
    .k811-example { opacity: 0; transform: translateY(16px); transition: opacity .4s, transform .4s; }
    .k811-example.revealed { opacity: 1; transform: none; }
}
```

---

## 5. SCSS
**Optional, compile-time only.** Block styles **may** be authored as `styles/scss/block/{name}.scss` and compiled to `blocks/{name}/{name}.css` (what EDS serves). Shared tokens: `styles/scss/_config.scss`, `_brand.scss`, `_breakpoints.scss`. Full pipeline: `docs/handbook/15-scss-compiler.md`.

**Rules**
- Source path is `styles/scss/block/{name}.scss` — **not** next to the CSS in `blocks/`. Basename must match the block folder.
- `@use "brand";` then `background: brand.color(primary);` (kotak811 → `#fa1432`). Switch palettes in `_config.scss` (`$brand: kotak811` or `kotak`) or `npm run build:css -- --brand=kotak`.
- 2-space indent in `.scss`; generated CSS is 4-space. Unix LF.
- Run `npm run build:css` after SCSS changes; **commit the generated `.css`**. Do not hand-edit generated CSS.
- `sass` is a **devDependency**. `*.scss` is in `.hlxignore`. Stylelint lints the compiled CSS.
- Blocks without an SCSS file stay hand-written CSS.

**Anti-patterns:** editing generated `blocks/{name}/{name}.css` · committing SCSS without CSS · putting `.scss` under `blocks/` · hardcoded `#fa1432` instead of `brand.color(primary)` · adding `sass` as a runtime/browser dependency.

```scss
@use "brand";
@use "breakpoints" as bp;

.cta-banner {
  background: brand.color(dark-bg);

  @include bp.desktop {
    max-width: 1120px;
  }
}
```

---

## 6. Dialogs
**N/A here — no Granite/Coral author dialogs, no `cq:dialog`.**

**EDS equivalent:** authoring UI is defined by the block's **`_{block}.json`** Universal Editor model (`definitions` + `models` + optional `filters`). Field components: `reference` (assets), `text`, `richtext`, `select`, `aem-content`.
- Give authors meaningful labels, sensible grouping, clearly-marked optionals.
- `definitions` use `resourceType: core/franklin/components/block/v1/block`.
- **After editing any `_*.json`, run `npm run build:json`**; never hand-edit the aggregate JSON files; `plugin:xwalk/recommended` must pass lint.

---

## 7. Naming conventions
- **Blocks / folders / files:** lowercase-hyphenated — `blocks/k811-hero/k811-hero.js|css`, `_k811-hero.json`. Migration blocks use the **`k811-`** prefix.
- **CSS classes:** scoped to the block, hyphenated, prefixed with the block name — `.k811-hero-title`. No `-container` / `-wrapper`.
- **JS:** `camelCase` variables/functions, `PascalCase` for classes/constructors, `UPPER_SNAKE_CASE` for module-level constants.
- **ES modules:** lowercase-hyphenated filenames (`k811-common.js`, `eligibility-modal.js`).
- **Config files:** keep platform names exactly (`fstab.yaml`, `helix-query.yaml`, `helix-sitemap.yaml`, `head.html`, `.hlxignore`).
- **Branches:** feature branches (e.g. `k811-page-migration`); never commit to `main`.
- **Commits:** imperative, focused; end with the project's `Co-Authored-By` trailer when applicable.

---

## 8. Package / repository structure
No Java packages. Repository layout (see `AGENTS.md` for the full tree):
```
blocks/{name}/{name}.js|.css|_{name}.json   # one folder per block (shared + k811-*)
scripts/                                     # aem.js (core, do not edit), scripts.js, delayed.js, k811/, shared modules
styles/                                      # styles.css (global+LCP), lazy-styles.css, fonts.css, kotak811.css
styles/scss/                                 # _brand.scss, _config.scss, block/{name}.scss (compiled, not served)
models/                                      # _component-*.json default-content models
icons/ fonts/                                # optimized assets only
content/                                     # authored HTML snapshots — DO NOT hand-edit
tools/importer/                              # migration parsers/transformers/page-templates/bundles
docs/                                        # skills/, prompts/, this file (not served — .hlxignore excludes *.md)
head.html fstab.yaml helix-*.yaml .hlxignore # config surface
component-*.json                             # AGGREGATES — generated, never hand-edit
```
Rules: one block per folder; shared logic in `scripts/`; global vs lazy CSS split respected; generated aggregates never hand-edited; nothing private committed without adding it to `.hlxignore`.

---

## 9. Logging
No server logs. Client-side guidance:
- Use `console.warn`/`console.error` sparingly for genuine developer diagnostics; **remove `console.log` debug noise before commit** (ESLint flags it).
- **Never log PII or secrets** anywhere, including to Sentry (`scripts/sentry.js`), which handles error monitoring.
- Prefer failing gracefully (degrade the block) over noisy logging in production paths.
- The dev server runs with `--forward-browser-logs`; use it for local debugging, not committed logging.

---

## 10. Exception handling
- **Decorate defensively so exceptions don't arise:** null-check cells, guard optional fields, tolerate reordered/missing content. A block must never throw on absent optional content.
- Wrap risky async work (network `fetch`, JSON parse) in `try/catch`; on failure, **degrade gracefully** (hide the affected sub-part, keep the rest of the page working) rather than breaking `decorate`.
- Don't swallow errors silently in a way that hides bugs; surface genuine developer errors via `console.error` (no PII) and let Sentry capture them.
- Never `catch` just to rethrow with no added value; never use exceptions for normal control flow.

```js
try {
  const { data } = await (await fetch('/data/offers.json')).json();
  render(block, data);
} catch (e) {
  block.hidden = true;          // degrade gracefully
  // eslint-disable-next-line no-console
  console.error('k811-offers: failed to load offers', e);
}
```

---

## 11. Dependency injection
**N/A here — no OSGi `@Reference`/DI container.**

**EDS equivalent:** dependencies are explicit **ES module imports** (with `.js` extensions). Shared "services" are small modules under `scripts/` (e.g. `k811/k811-common.js` exposing `initK811`). Keep modules dependency-free where possible and tree-shakeable-by-hand. Import what you use; do not build a DI/service-locator abstraction.

---

## 12. OSGi configuration
**N/A here — no OSGi, no `@Designate`/`@ObjectClassDefinition`, no Felix console.**

**EDS equivalent — the configuration surface is:**
- `fstab.yaml` (content mount), `helix-query.yaml` (`query-index.json` fields), `helix-sitemap.yaml` (sitemap), `head.html` (CSP + eager asset loads), `.hlxignore` (non-served files).
- Treat these as deliberate config; don't repoint `fstab.yaml` casually; keep the CSP strict.

---

## 13. Annotations
**N/A here — no Java annotations** (`@Component`, `@Model`, `@ValueMapValue`, `@Reference`, `@Designate`).

**EDS equivalent:** metadata is expressed as **JSON** (`_{block}.json` model definitions, merged into the aggregates via `npm run build:json`) and **JSDoc** on JS functions. Document exported/`decorate` functions with JSDoc; describe authored fields via the model JSON, not annotations.

---

## 14. Performance
Target Lighthouse/PSI **100** ("Keeping it 100").
- **Protect LCP:** eager phase does the minimum. LCP image via `createOptimizedPicture` + the `k811-hero` media-scoped `<link rel=preload>` pattern; only the LCP image gets `fetchpriority="high"`/`loading="eager"`, everything else `loading="lazy"`.
- **Three-phase split** (`scripts.js` → `loadPage`): eager = LCP only; lazy = rest + header/footer + `lazy-styles.css`; delayed = martech (`delayed.js`).
- **CSS:** LCP-critical in `styles.css`, rest in `lazy-styles.css`; block CSS auto code-splits.
- **JS:** no unnecessary dependencies; prefer the ~2KB shared IntersectionObserver over animation libs.
- **Animations:** transform/opacity only; honor `prefers-reduced-motion`.
- **Assets:** optimize + size-check images/fonts/icons; subset fonts.
- **Measure** with PSI on the feature preview URL before/after.

---

## 15. Accessibility
Meet **WCAG 2.1 AA**.
- Semantic HTML5; correct, unskipped heading hierarchy; single `<h1>` per page; preserve semantics when restructuring the DOM.
- `alt` on all meaningful images; `alt=""` on decorative ones.
- Native elements (`<button>`, `<a>`, `<dialog>`) over ARIA; add ARIA only where native semantics fall short and never contradict them.
- Interactive blocks fully keyboard-operable: visible focus, logical tab order, `Esc` to close, no keyboard traps, focus returned to trigger (see `eligibility-modal.js`).
- Wrap motion in `prefers-reduced-motion`; meet AA contrast against the kotak811 tokens; label form controls and associate errors.

---

## 16. Security
Everything here is **public client-side code**.
- **Never commit secrets;** never accept/store/echo/use credentials pasted into chat. Git push, `admin.hlx.page`, and Document Authoring uploads get credentials injected via the Settings opt-in — no in-band token needed. On 401/403, direct the user to Settings → LLM Permissions; don't ask for a token.
- **Sanitize any authored/remote HTML** with `scripts/dompurify.min.js` before `innerHTML`.
- **Respect the CSP** in `head.html` (`script-src 'nonce-aem' 'strict-dynamic' …`): inline scripts need `nonce="aem"`; no `eval`/inline handlers; external fetch origins must be allowed by `connect-src`.
- No PII/secrets in Sentry. Vet new third-party JS for size/provenance (Renovate keeps deps patched). Follow WCAG 2.1 AA + Adobe security guidance.

---

## 17. Code review checklist
Reviewers confirm **all** of the following (subset of the `AGENTS.md` Definition of Done):

**Correctness & structure**
- [ ] Feature branch (not `main`); focused, clearly-messaged commits.
- [ ] No Java/HTL/Dialogs/OSGi/Dispatcher/Cloud-Manager artifacts introduced. SCSS only under `styles/scss/`; generated CSS committed.
- [ ] `scripts/aem.js` untouched; no hand-edited files under `content/`.
- [ ] Block decorates by classifying cells by content; idempotent; defensive on missing/extra/reordered cells; instrumentation preserved (`moveInstrumentation()`).

**Standards**
- [ ] JS: Airbnb style, `.js` import extensions, Unix LF, 2-space indent, JSDoc on `decorate`/exports; no stray `console.log`.
- [ ] CSS: 4-space indent, all selectors scoped to `.{block}`, no `-container`/`-wrapper`, mobile-first 600/900/1200.
- [ ] Naming conventions followed (lowercase-hyphenated blocks, `k811-` prefix, scoped classes).
- [ ] Any `_*.json` change → `npm run build:json` run; three aggregates committed & in sync.

**Quality gates**
- [ ] `npm run lint` passes (JS + CSS + xwalk); `gh pr checks` green (lint + JSON-sync).
- [ ] Performance: LCP protected, phase split correct, PSI run on preview (target 100).
- [ ] Accessibility: headings, alt text, ARIA, keyboard, `prefers-reduced-motion`.
- [ ] Security: no secrets, HTML sanitized where injected, CSP respected, no PII in Sentry.
- [ ] Exceptions handled → graceful degradation, not thrown from `decorate`.
- [ ] Rendering verified in preview at mobile/tablet/desktop; content/visual parity for migration work.
- [ ] AEM Code Sync published the branch; PR includes a `https://{branch}--kotakbank--xeragobiz.aem.page/{path}` link.
