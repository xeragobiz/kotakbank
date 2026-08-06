# Lesson 13 — Testing, Linting & CI/CD

> Tier 4 · Performance, Quality & Delivery · Prerequisites: Lessons 04–08

## 1. Theory

EDS has **no heavyweight test framework wired into CI** — and that's deliberate. Quality is enforced by a lean, layered gate:

1. **Linting** (mandatory, CI-enforced) — ESLint (Airbnb base + `plugin:xwalk` + `plugin:json`) and Stylelint (standard). Style is not negotiable; the machine checks it.
2. **JSON-sync gate** — CI regenerates the aggregate `component-*.json` and fails if they differ from what's committed (Lesson 08).
3. **Browser/visual testing** — Playwright against `http://localhost:3000`: `snapshot` (DOM/a11y tree, cheap) and `evaluate` (computed styles) for routine checks; `screenshot` only for genuine pixel QA (expensive).
4. **Unit tests** — reserved for *pure utilities/logic* where they add durable value. DOM-transform blocks are usually validated by browser checks, not unit tests.
5. **PageSpeed Insights** — run against the feature preview URL, targeting 100.
6. **Human PR review** — a person checks the mandatory preview-URL link.

## 2. Architecture — the pipeline

```
local:  edit → npm run lint (JS+CSS) → build:json (Husky pre-commit) → Playwright check
   │
git push (feature branch)
   ▼
GitHub Actions (main.yaml):  npm ci → npm run lint → build:json → git diff --exit-code (aggregates)
   │                                                    │ fails if stale
   ▼
AEM Code Sync:  publishes branch → https://<branch>--<repo>--<owner>.aem.page/
   ▼
PSI on preview URL  →  PR to main WITH preview link  →  human review  →  merge
```

**Husky pre-commit** regenerates and re-stages aggregates for staged `_*.json`, so you rarely hit the CI JSON gate if you commit normally.

## 3. Engineering rationale

**Why lint-first, light on unit tests?** In a no-build, DOM-transform architecture, most "logic" is *reshaping delivered HTML* — best verified by rendering the real DOM (Playwright) against a real page, not by mocking the DOM in a unit test. Unit tests shine for *pure* functions (parsers, formatters, the import transformers). Spending effort unit-testing every `decorate` yields brittle tests with low value; browser verification catches what actually matters (does it render/behave/scale).

**Why is linting a hard gate?** Consistency across ~50 blocks and multiple contributors. Airbnb + the local overrides (`.js` import extensions, Unix LF, `no-param-reassign` allowing property mutation) encode the project's conventions so review can focus on design, not formatting.

**Why the JSON-sync gate?** UE depends on the aggregates; if they drift from the partials, authoring breaks silently. The `git diff --exit-code` after regeneration guarantees they're always in sync — codegen freshness enforced by CI.

**Why measure on the preview URL, not localhost?** The edge runs the real image pipeline, CDN, and compression; localhost doesn't. A green local Lighthouse can hide a red edge score.

**Why the mandatory preview link in the PR?** So a human can *see* the change on the real edge before merge — the final quality gate that automation can't replace.

## 4. Examples

**Local quality loop:**
```bash
npm run lint          # JS + CSS; must pass before commit/PR
npm run lint:fix      # auto-fix what it can
npm run build:json    # regenerate aggregates after any _*.json change
gh pr checks          # watch CI status on the PR
```

**Cheap Playwright verification (preferred over screenshots):**
```js
// DOM/a11y structure
await page.goto('http://localhost:3000/drafts/promo.html');
const html = await page.locator('.promo').innerHTML();
// computed style spot-check
const bg = await page.evaluate(() =>
  getComputedStyle(document.querySelector('.promo .button')).backgroundColor);
```

**A worthwhile unit test (pure logic in an import transformer):**
```js
import { normalizeHref } from '../tools/importer/transformers/links.js';
assert.equal(normalizeHref('https://old.example.com/x'), '/x');
```

## 5. Hands-on exercises

1. **Break and fix lint.** Introduce a bare `import x from '../foo'` (no `.js`) and a CRLF line; run `npm run lint`, read the errors, fix them.
2. **Trigger the JSON gate.** Edit a `_<block>.json` field, commit *without* running `build:json` in a way that bypasses Husky, and observe the CI failure; then fix by regenerating.
3. **Playwright check.** Write a script that navigates to a draft, asserts the block exists at desktop and mobile widths (`page.setViewportSize`), and checks one computed style.
4. **Decide the test type.** For (a) a date formatter, (b) a hero `decorate`, (c) a query-index filter — say whether you'd unit test or browser-verify, and why.
5. **PR dry run.** List everything that must be green/present before you'd open the PR (checks, preview link, PSI).

## 6. Common mistakes

- **Skipping `npm run lint`** locally and getting bounced by CI.
- **Forgetting `build:json`**, tripping the JSON-sync gate.
- **Screenshot-first testing** — token/time-expensive; use snapshot/evaluate first.
- **Unit-testing DOM transforms** heavily instead of browser-verifying.
- **Opening a PR without the preview URL** — rejected by policy.
- **Measuring PSI on localhost** only.

## 7. Review questions

1. What are the two hard, machine-enforced CI gates?
2. Why does EDS lean on browser verification over unit tests for blocks — and where do unit tests still belong?
3. What does the JSON-sync gate check, and what usually prevents you from hitting it?
4. Why prefer Playwright `snapshot`/`evaluate` over `screenshot`?
5. Why must PSI run on the preview URL, and why is the preview link mandatory in the PR?

## 8. Best practices

- **Lint before every commit**; wire it into your loop.
- **Commit regenerated aggregates** with the partial change, same PR.
- **Verify each changed block** on a real draft at mobile/tablet/desktop with Playwright.
- **Unit-test pure logic** (importers, parsers, formatters).
- **Run PSI on the preview**; fix before merge.
- **Always include the preview URL** in the PR description.

## 9. Anti-patterns

- **Committing directly to `main`.**
- **Disabling lint rules** to push code through.
- **Hand-editing aggregates** to dodge the gate.
- **Screenshot-heavy QA** for routine structural checks.
- **"Works on my machine"** performance claims from localhost.

---

**Next:** [Lesson 14 — Migration Engineering (Import Pipeline) →](lesson-14-migration.md)
