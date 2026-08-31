# Design-System Hardening & Block-Development Readiness Plan

## Overview

The global design system is merged into `main`: `styles/variables.css` (Figma tokens), `styles/grid.css` (responsive 4/8/12-column system), and `styles/styles.css` (eager-imports both, bridges legacy boilerplate tokens onto the new semantic tokens). This plan closes the gaps found in review and makes the token/grid system the **enforced, single source of truth** so block development can start on a solid, bank-grade base.

> **Status: execution-ready.** All decisions resolved. Writes are currently blocked because the harness is still in plan mode — **switch to Execute mode to apply the changes below.** No further input needed.

**Decisions locked in:**
1. **Enforcement:** automated stylelint guardrail — raw hex/rgb colors and raw px for spacing/radius/type in *new block* CSS fail CI; must use `var(--token)`.
2. **Breakpoints:** standardize new work on **476 / 835 / 1025**. Update `styles.css` section rules + `AGENTS.md`. Existing shared blocks stay 600/900/1200 until individually migrated.
3. **Content width:** align the global section wrapper to the grid's **1736px**.
4. **Token source (C4):** rewrite the `variables.css` header to declare it **hand-maintained** (the referenced SCSS/generator don't exist in the repo).
5. **Brand font (C5):** **keep Roboto**, but tokenize the family (`--font-family-base` / `--font-family-heading`) so a future rebrand is one-line.

## Findings from Review

**Strengths (keep):**
- Clean three-tier token architecture: primitives → semantic aliases → responsive typography.
- `styles.css` legacy-token bridge means 50+ existing blocks inherit the system with zero per-block edits.
- Lint passes; tokens verified resolving on a rendered page (grid tier + legacy aliases confirmed).

**Concerns & resolutions:**
- **C1 — Breakpoint mismatch** (grid/type at 476/835/1025 vs. sections/AGENTS.md at 600/900/1200). → standardize on 476/835/1025.
- **C2 — Content-width conflict** (section caps 1200px; grid allows 1736px). → align section to 1736px.
- **C3 — No enforcement of "tokens only."** → stylelint guardrail, **scoped to `blocks/**/*.css` new work only** (confirmed necessary: `lazy-styles.css` and existing blocks are full of raw values and must not break CI).
- **C4 — Dead generator reference.** → rewrite header as hand-maintained.
- **C5 — Font family not tokenized.** → tokenize, keep Roboto.
- **C6 — Two scoped systems** (`.kotak811`/Manrope vs. global tokens). → write the governing rule in AGENTS.md.
- **C7 — Grid utilities unused/undocumented.** → author a reference skeleton.
- **C8 — `@import` chaining on critical path.** → measure vs. Lighthouse 100; move to `head.html` `<link>`s only if it regresses.

**Tooling note discovered:** `stylelint-declaration-strict-value` is **not installed** (only `stylelint` + config-standard/recommended). Item 3 therefore needs either (a) adding that plugin as a devDependency, or (b) implementing the guardrail with built-in rules (`color-no-hex`, `declaration-property-value-disallowed-list`, `declaration-property-unit-allowed-list`). Plan defaults to (b) to avoid a new dependency; fall back to (a) if built-ins prove too coarse.

## Proposed Changes

### 1. Reconcile breakpoints on 476/835/1025 (C1)
- [ ] Change `styles/styles.css` section media query `@media (width >= 900px)` → design tiers (835/1025 steps for section padding).
- [ ] Update `AGENTS.md` CSS section: 600/900/1200 → **476/835/1025** for new blocks; note legacy blocks stay on old tiers until migrated.
- [ ] Audit `styles.css` + `lazy-styles.css` for other hardcoded layout tiers.

### 2. Align section content width to 1736px (C2)
- [ ] `main > .section > div` `max-width: 1200px` → `var(--grid-max-width-desktop)` (1736px); keep token-based padding.
- [ ] Verify `/en/home` + a k811 page still look right at the wider cap.

### 3. Add the stylelint token guardrail (C3)
- [ ] Add rules **scoped via `overrides` to `blocks/**/*.css`** (NOT `styles/*` or `lazy-styles.css`): forbid raw hex/rgb on color/background/border; forbid raw `px` on `font-size`/`margin`/`padding`/`gap`/`border-radius` (allow `0`, `1px`, `var()`).
- [ ] Grandfather existing blocks that violate (targeted `overrides` disable or per-file allow) so CI stays green on merged code.
- [ ] Document the `/* stylelint-disable-next-line */` exception convention.
- [ ] `npm run lint`: confirm passes on current code; add a throwaway raw-value test to confirm it fails.

### 4. Rewrite variables.css header as hand-maintained (C4)
- [ ] Replace the "Do not edit by hand — regenerate with scss-to-css.js" comment with an accurate statement that `variables.css` is the hand-maintained token source of truth.

### 5. Tokenize the brand font family, keep Roboto (C5)
- [ ] Add `--font-family-base` / `--font-family-heading` to `styles.css` `:root` (Roboto values); point `--body-font-family` / `--heading-font-family` at them.

### 6. Write the "strict tokens, no new classes" convention (C6, C7)
- [ ] Add a **Design System Usage** section to `AGENTS.md`:
  - New/non-k811 blocks MUST use semantic tokens (colors, `--spacing-spacing-*`, `--cr-*`, `--body-*`/`--headline-*`/`--display-*`, `--ls-*`).
  - Layout MUST use `.grid` + `.grid-col-*`/`-t-*`/`-d-*`; no bespoke column math.
  - No raw values where a token exists; no parallel class names for concepts the system already names.
  - Scope boundary: `.kotak811` governs migrated k811 pages; global tokens govern everything else.
- [ ] Author one **reference block skeleton** CSS demonstrating correct token + grid usage.

### 7. Validate loading strategy for Lighthouse 100 (C8)
- [ ] Run PSI/Lighthouse on preview with current `@import` chain.
- [ ] If CSS timing/LCP regresses, move `variables.css` + `grid.css` to explicit `<link>`s in `head.html` (before `styles.css`); else keep `@import`.

### 8. Final verification
- [ ] `npm run lint` (JS + CSS) green including the guardrail.
- [ ] Playwright at **375 / 768 / 1024 / 1440 / 1920px**: grid columns/margins + typography reflow together at 476/835/1025; section honors 1736px.
- [ ] Smoke-test `/en/home` + one k811 page for regressions.
- [ ] Dedicated branch (`feature/design-system-hardening`) → push → PR to `main` with mandatory `https://{branch}--kotakbank--xeragobiz.aem.page/{path}` preview link.

## Are we good to start block development?

**Yes — after items 1–3 and 6 land.** The token + grid base is sound and merged. The guardrail (3) + written convention/skeleton (6) are what make the "strict, tokens-only, no different classes" rule real rather than aspirational; breakpoint/width alignment (1–2) ensures the first blocks build on final layout rules. Items 4, 5, 7 are non-blocking and can run alongside or right after.

## Checklist

- [ ] **Breakpoints:** retune `styles.css` section media queries to 476/835/1025; update `AGENTS.md`; audit for other hardcoded tiers
- [ ] **Content width:** set section `max-width` to `var(--grid-max-width-desktop)` (1736px); verify on existing pages
- [ ] **Guardrail:** add stylelint rules scoped to `blocks/**/*.css` (color + raw-px); grandfather existing/lazy code; document exception; verify pass/fail
- [ ] **Token header:** rewrite `variables.css` "do not edit by hand" comment to hand-maintained
- [ ] **Font tokens:** add `--font-family-base`/`--font-family-heading` (Roboto) and wire `--body/heading-font-family`
- [ ] **Convention:** add "Design System Usage" rules to `AGENTS.md` (tokens-only, grid utilities, no parallel classes, k811 vs global scope)
- [ ] **Skeleton:** author one reference block CSS demonstrating correct token + grid usage
- [ ] **Loading:** measure `@import` chain vs Lighthouse 100; switch to `head.html` `<link>`s if needed
- [ ] **Verify:** lint green; Playwright at 375/768/1024/1440/1920; smoke-test home + a k811 page
- [ ] **Ship:** dedicated branch → push → PR to `main` with preview link
- [ ] *(Toggle the session to **Execute mode** to begin — the first edit is already queued.)*
