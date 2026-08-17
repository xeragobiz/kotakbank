# 09 · Verification & Validation Loops

An AEM assistant is only as trustworthy as its ability to check its own work against real feedback. This document defines the verification layers.

## The verification ladder (cheap → expensive, run in order)
1. **Lint** (`npm run lint`) — JS/CSS/xwalk model. Fast, deterministic, catches most style/syntax errors.
2. **JSON-sync** (`build:json` + `git diff --exit-code`) — aggregates in sync. The CI gate; run it locally first.
3. **Static self-review** — the model re-reads its diff against the coding-standards checklist.
4. **Render check** (Playwright `snapshot`/`evaluate`) — the block actually renders; DOM/a11y tree correct; computed styles applied. Cheap text-based inspection.
5. **Visual parity** (Playwright `screenshot` + diff) — pixel-level match to the original. Expensive; reserve for genuine design QA and migration fidelity.
6. **Performance** (PSI on the preview URL) — target 100; LCP/CLS/INP.
7. **Human review** (PR) — the final gate; mandatory preview link.

*Why ordered cheap-first:* fail fast on the cheapest signal. Don't spend a screenshot (20–50k tokens) on code that doesn't lint.

## Prefer text over pixels for routine checks
`snapshot` (DOM + accessibility tree, ~1–2k tokens) and `evaluate` (computed styles) answer most "did it render / is the style applied" questions cheaply. `screenshot` is the last resort for pixel-accuracy. *Decision:* default the verification tools to text; make screenshots opt-in. This is both a cost and a reliability decision — text assertions are checkable, screenshots need a model to judge.

## The generate → verify → fix loop
```
generate → lint → (fail? read errors, fix, retry ≤N) → render → (wrong? adjust, retry ≤N) → done
```
Bounded retries prevent infinite loops; each iteration must consume the *actual* error/DOM, not re-guess. *Why bounded:* an unbounded fix loop burns budget and often oscillates; after N tries, surface the blocker to the human with the exact failure.

## Adversarial verification for high-stakes claims
For migration fidelity or "this is correct," spawn an independent verifier prompted to **refute**: "Find a width where this differs from the original. Find an omitted field that breaks it." Accept only if refutation fails. *Why:* the generating agent is biased toward believing its own output; an adversary with a different objective catches what self-review misses.

## Migration-specific validation
- **Content parity:** every section/field from the source present in the EDS page.
- **Visual parity:** layout/spacing/color match at mobile/tablet/desktop, including animations.
- **Authoring validation:** the block is insertable and editable in Universal Editor; instrumentation preserved.
- **Regression:** shared-block changes smoke-tested on other pages that use them.

## Validation checklists as executable intent
Each skill and the review checklist ([`docs/REVIEW_CHECKLIST.md`]) end in a checkbox list. The assistant treats these as a **self-verification protocol**, not decoration — it walks the list and confirms each item with a tool where possible. *Why:* a checklist the model actually executes turns "best practices" into enforced behavior.

## Example: verifying a CSS change
```
edit blocks/k811-cta/k811-cta.css
bash npm run lint                                   → pass
playwright navigate :3000/index.html
playwright evaluate getComputedStyle('.k811-cta')   → background rgb(0,0,0) ✓, radius 20px ✓
playwright snapshot                                 → structure intact, headings present ✓
(only if pixel QA needed) screenshot + compare
```
No screenshot spent because `evaluate` already confirmed the properties.

## Why verification is the difference between a demo and a product
Any model can emit plausible AEM code. What makes an assistant *shippable* is that it runs the same gates a senior engineer would — lint, render, compare, PSI — and refuses to claim "done" until they pass. Verification is where correctness is *earned* rather than *asserted*.
