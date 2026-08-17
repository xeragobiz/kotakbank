# Review Checklist

For the **reviewer** of a PR (human or AI). The author self-checks with `docs/PR_CHECKLIST.md`; this is the independent gate. Approve only when every applicable box is genuinely verified — not assumed.

## 0. Gate before reviewing
- [ ] PR targets `main` from a feature branch and **includes a `https://{branch}--kotakbank--xeragobiz.aem.page/{path}` preview link.** No link → request changes, stop.
- [ ] `gh pr checks` green (lint + component-JSON freshness). Red → request changes, stop.

## 1. Safety (platform-breaking — reject on any)
- [ ] `scripts/aem.js` **unchanged**.
- [ ] No hand-edited files under `content/`.
- [ ] Aggregate `component-*.json` regenerated (not hand-edited); in sync with `_*.json`.
- [ ] No Java/HTL/SCSS/OSGi/Dispatcher/Cloud-Manager artifacts introduced.

## 2. Block correctness
- [ ] Delivered DOM was inspected (decoration matches real `.plain.html` markup).
- [ ] Cells classified by content, not index; missing/extra/reordered cells tolerated; **idempotent**.
- [ ] `moveInstrumentation()` used on moved nodes (UE overlays preserved).
- [ ] Images via `createOptimizedPicture`; k811 blocks call `initK811`.
- [ ] No duplicate of an existing block; shared-block changes are additive + dependent pages considered.

## 3. Standards
- [ ] JS: Airbnb, `.js` imports, Unix LF, 2-space, JSDoc on `decorate`/exports; no stray `console.log`.
- [ ] CSS: 4-space, all selectors scoped to `.{block}`, no `-container`/`-wrapper`, mobile-first 600/900/1200.
- [ ] Naming conventions honored (lowercase-hyphenated, `k811-` prefix, scoped classes).

## 4. Authoring (Universal Editor)
- [ ] `_{block}.json` fields meaningful, grouped, optionals marked; `resourceType: core/franklin/components/block/v1/block`.
- [ ] Block insertable + editable in UE (author-experience sanity check).

## 5. Non-functional
- [ ] **Accessibility:** headings, alt text, ARIA, keyboard, `prefers-reduced-motion`, AA contrast.
- [ ] **Performance/CWV:** LCP discipline applied; PSI run on the preview URL (target 100); LCP≤2.5s, CLS≤0.1, healthy INP.
- [ ] **Security:** injected HTML sanitized; CSP respected (`nonce="aem"`, no `eval`); no secrets; no PII in Sentry.
- [ ] **Responsive:** verified at mobile/tablet/desktop; no overflow/overlap.
- [ ] **SEO:** metadata (`og:title`/`description`/`og:image`/`robots`) correct; sitemap unaffected/updated.

## 6. Migration parity (if applicable)
- [ ] Rendered EDS page matches the original Kotak811 page in content and design (incl. animations).

## 7. Verdict
- [ ] **Approve** — all applicable boxes verified.
- [ ] **Request changes** — list the failing items with file:line and the required fix.

## Reviewer notes
- Verify, don't trust: open the preview URL and the diff; don't approve on the author's word.
- Prefer `snapshot`/`evaluate` over `screenshot` when spot-checking rendering.
- Distinguish blocking (Safety, red CI, missing preview link) from non-blocking nits; be explicit which is which.

## Why a separate review checklist
The PR checklist is a *self*-check the author runs while building; a reviewer needs a differently-ordered gate that leads with the **stop conditions** (missing preview link, red CI, platform-breaking edits) so a bad PR is rejected in seconds without a full read. It also adds reviewer-specific discipline — verify against the live preview rather than trusting the author, and separate blocking issues from nits — that has no place in a self-check.
