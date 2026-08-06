# 17 · Testing

## Purpose
Validate changes before a PR: mandatory lint, browser/visual verification with Playwright, content parity for migration, accessibility, and performance. There is no heavyweight test framework in CI beyond lint + the JSON-sync gate. See the `testing-blocks` skill / aem.live testing docs.

## When to use
- After any code change to a block, script, or style, before committing/opening a PR.
- When changing a shared block (smoke-test other pages that use it).

## Best practices
- **Lint is mandatory:** `npm run lint` (JS + CSS) must pass; CI enforces it. Auto-fix with `npm run lint:fix`.
- **Browser testing:** use Playwright MCP against `http://localhost:3000`. Prefer `snapshot` (DOM/a11y tree, cheap) and `evaluate` (computed styles) for routine checks; use `screenshot` **only** for genuine pixel-level design QA (token-expensive).
- **Verify every changed block** on a real page/draft at **mobile (≤600px), tablet, desktop** widths. For pages with no authored content, drop static HTML in `drafts/` and start with `--html-folder drafts`.
- **Content parity** (migration): compare the rendered EDS page against the original Kotak811 page.
- **Accessibility:** headings, alt text, ARIA, keyboard, reduced-motion (see [15](15-accessibility.md)).
- **Performance:** PSI on the feature preview URL, target 100 (see [14](14-performance.md)).
- **Unit tests** only for pure utilities/logic where they add durable value; browser checks may be throwaway.
- **Regression:** changing a shared block → smoke-test the other pages that use it.

## Anti-patterns
- ❌ Committing/opening a PR without running lint.
- ❌ Defaulting to `screenshot` for routine checks (use `snapshot`/`evaluate`).
- ❌ Testing only desktop; skipping mobile/tablet.
- ❌ Editing a shared block without regression-checking dependent pages.
- ❌ Writing brittle unit tests for DOM decoration better verified in-browser.

## Examples
```bash
npm run lint            # JS + CSS — must pass
npm run lint:fix        # auto-fix
npx -y @adobe/aem-cli up --no-open --forward-browser-logs
# then, via Playwright MCP:
#  navigate http://localhost:3000/index.html
#  snapshot  (structure/a11y)  → cheap
#  evaluate  (getComputedStyle) → CSS checks
#  screenshot → only for final pixel QA
```

## Validation checklist
- [ ] `npm run lint` passes (JS + CSS).
- [ ] Each changed block verified in preview at mobile/tablet/desktop via snapshot/evaluate.
- [ ] Screenshots used only for genuine pixel QA.
- [ ] Migration: content/visual parity with the original checked.
- [ ] Accessibility and PSI (target 100) verified.
- [ ] Shared-block changes regression-tested on dependent pages.
