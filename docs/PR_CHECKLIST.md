# Pull Request Validation Checklist

Run through this **before opening every PR to `main`**. It is the operational form of the `AGENTS.md` Definition of Done, grounded in this repo's real commands. Copy the checklist into the PR description and tick each box.

> **Stack note:** This is an **AEM Edge Delivery Services** repo — no Java/Maven/OSGi/Dispatcher/Cloud Manager. Traditional gates (Compilation, Integration Tests, Cloud Manager Quality, Dispatcher Validation) are reinterpreted to their EDS equivalents below, not dropped.

---

## Quick command sweep
```bash
npm run lint                 # JS + CSS + xwalk model lint (MUST pass)
npm run build:json           # only if a _*.json model changed; commit the aggregates
git diff --exit-code component-definition.json component-models.json component-filters.json  # must be clean
gh pr checks                 # GitHub Actions: lint + JSON-sync gate must be green
# PSI: run against https://{branch}--kotakbank--xeragobiz.aem.page/{path}
```

---

## 1. Compilation → *Lint + JSON aggregation (no compile step)*
There is no Java/transpile build. "Compiles" here means lint-clean and aggregates in sync.
- [ ] `npm run lint` passes (ESLint airbnb-base + `plugin:xwalk` + `plugin:json`; Stylelint standard).
- [ ] `.js` import extensions present; Unix LF; 2-space JS / 4-space CSS indent.
- [ ] If any `_*.json` changed → `npm run build:json` run and the three aggregate JSONs committed & in sync.
- [ ] `scripts/aem.js` untouched; no files under `content/` hand-edited.

## 2. Unit Tests
- [ ] Pure utilities/logic changed → unit test added/updated where it adds durable value.
- [ ] Any existing tests still pass.
- [ ] No brittle unit tests written for DOM decoration better verified in-browser (use §3 instead).

## 3. Integration Tests → *Browser/preview verification*
There is no server integration harness; integration = the block rendering correctly on a real page via the dev server / preview.
- [ ] Dev server run (`npx -y @adobe/aem-cli up --no-open --forward-browser-logs`); block verified on a real page/draft.
- [ ] Delivered markup checked (`curl http://localhost:3000/path.plain.html`) — decoration matches actual DOM.
- [ ] Playwright MCP used: `snapshot` (DOM/a11y tree) + `evaluate` (computed styles) for verification; `screenshot` only for genuine pixel QA.
- [ ] Shared-block change → dependent pages smoke-tested for regressions.

## 4. Cloud Manager Quality → *GitHub Actions + Code Sync*
No Cloud Manager. Equivalent gates:
- [ ] `gh pr checks` green — lint + component-JSON freshness gate (`main.yaml`).
- [ ] AEM Code Sync successfully published the branch to the preview environment.
- [ ] Work on a feature branch (not `main`); focused, clearly-messaged commits.

## 5. Security
- [ ] No secrets committed; no credential pasted/echoed/used (Git push / DA uploads use the Settings opt-in, not in-band tokens).
- [ ] Any authored/remote HTML injected via `innerHTML` is sanitized with `scripts/dompurify.min.js`.
- [ ] CSP in `head.html` respected — inline scripts carry `nonce="aem"`; no `eval`/inline handlers; external fetch origins allowed by `connect-src`.
- [ ] No PII/secrets logged to Sentry; new third-party JS vetted for size/provenance.

## 6. Accessibility (WCAG 2.1 AA)
- [ ] Semantic HTML; correct, unskipped heading hierarchy; single `<h1>`.
- [ ] All meaningful images have `alt`; decorative images `alt=""`.
- [ ] Interactive blocks fully keyboard-operable — visible focus, logical tab order, `Esc` to close, no traps, focus returned to trigger.
- [ ] ARIA used only where native semantics fall short and never contradicts them.
- [ ] Animations wrapped in `prefers-reduced-motion`; AA color contrast met.

## 7. Performance
- [ ] Eager phase minimal; lazy/delayed split correct (martech in `delayed.js`).
- [ ] LCP image eager + `fetchpriority="high"` (+ preload if art-directed via the `k811-hero` pattern); all other images `loading="lazy"`.
- [ ] LCP-critical CSS only in `styles/styles.css`; the rest in `lazy-styles.css`.
- [ ] No unnecessary runtime dependencies; shared IntersectionObserver preferred over animation libs.
- [ ] Assets optimized/size-checked; fonts subset.

## 8. Dispatcher Validation → *`.hlxignore` + CSP*
No Dispatcher. Equivalent:
- [ ] Any new private/build-only file added to `.hlxignore` (nothing sensitive served).
- [ ] Security headers/CSP changes confined to `head.html`; CSP kept strict.
- [ ] No `dispatcher/` config or cache-invalidation scripts introduced.

## 9. Authoring Validation (Universal Editor)
- [ ] `_{block}.json` has meaningful labels, sensible grouping, clearly-marked optionals; correct field components (`reference`/`text`/`richtext`/`select`/`aem-content`).
- [ ] `definitions` use `resourceType: core/franklin/components/block/v1/block`.
- [ ] Block is insertable and editable in Universal Editor; `moveInstrumentation()` used on moved nodes (overlays preserved).
- [ ] Block decorates defensively — classifies cells by content (not index), tolerates missing/extra/reordered cells, idempotent.

## 10. Responsive Testing
- [ ] Verified in preview at **mobile (≤600px)**, **tablet (900px)**, **desktop (1200px+)**.
- [ ] CSS mobile-first with `min-width` breakpoints at 600/900/1200; all selectors scoped to `.{block}`; no `-container`/`-wrapper`.
- [ ] No horizontal overflow, overlap, or layout breakage at any breakpoint.

## 11. SEO
- [ ] Page metadata correct: `og:title`, `description`, `og:image`, `robots` (fields indexed by `helix-query.yaml` → `query-index.json`).
- [ ] Heading hierarchy semantically correct; descriptive link text; `alt` on images.
- [ ] Canonical/robots as intended; sitemap unaffected or updated (`helix-sitemap.yaml`).

## 12. Core Web Vitals
- [ ] **LCP** ≤ 2.5s (LCP image discipline in §7 applied).
- [ ] **CLS** ≤ 0.1 — no layout-shifting late content; animations transform/opacity only; images sized.
- [ ] **INP** healthy — no long tasks/heavy JS on interaction; work split across phases.
- [ ] Measured via **PSI on the feature preview URL**, targeting **100**; regressions fixed before merge.

## 13. Definition of Done
- [ ] Feature branch; matches surrounding style; all CSS scoped; mobile-first 600/900/1200.
- [ ] Block decorates defensively & idempotently; instrumentation preserved.
- [ ] `_*.json` changes → `build:json` run; aggregates committed & in sync; CI JSON-sync gate green.
- [ ] `npm run lint` passes locally and in CI; `gh pr checks` green.
- [ ] Rendering verified at mobile/tablet/desktop; content/visual parity with the original for migration work.
- [ ] Accessibility, Security, Performance/CWV verified as above.
- [ ] No secrets; CSP respected; authored HTML sanitized; `aem.js` untouched; no Java/HTL/OSGi/Dispatcher artifacts.
- [ ] AEM Code Sync published the branch.
- [ ] **PR description includes a `https://{branch}--kotakbank--xeragobiz.aem.page/{path}` link** to a page demonstrating the change (mandatory — PRs without it are rejected).
- [ ] Human review requested.

---

### Paste-ready PR block
```md
## Validation
- Preview: https://{branch}--kotakbank--xeragobiz.aem.page/{path}
- [ ] lint + build:json (aggregates in sync)  - [ ] gh pr checks green
- [ ] unit/logic tests           - [ ] browser/preview verified (mobile/tablet/desktop)
- [ ] security (CSP, sanitize, no secrets)     - [ ] accessibility (WCAG AA)
- [ ] performance + Core Web Vitals (PSI 100)  - [ ] authoring (UE) verified
- [ ] SEO metadata                - [ ] .hlxignore/CSP checked
- [ ] Definition of Done complete
```
See also: `docs/CODING_STANDARDS.md`, `docs/ARCHITECTURE.md`, `docs/skills/`, `.cursor/rules/`, `AGENTS.md`.
