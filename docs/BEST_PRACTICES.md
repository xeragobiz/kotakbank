# Best Practices

The positive playbook: what to do, and why. Pair with `docs/COMMON_MISTAKES.md` (the inverse). All grounded in `AGENTS.md`.

## Workflow
- **Inspect before you build.** `curl http://localhost:3000/path.plain.html` to see the real delivered DOM before writing `decorate()`. Never assume markup.
- **Design the content structure first.** The rows/cells/fields are the author↔code contract; decide them before JS.
- **Small feature branches, focused commits.** Never commit to `main`. End commit messages with the project `Co-Authored-By` trailer.
- **Run the loop:** install → `aem-cli up` → inspect → edit → `build:json` (if models changed) → `lint` → push → PSI on preview → PR with preview link.

## JavaScript
- One default-exported, JSDoc'd `decorate(block)` per block.
- **Classify cells by content** (picture-only → image, richtext → copy, `<a>` → CTA) — resilient to Universal Editor field-collapsing.
- Make decoration **idempotent** and **defensive**; tolerate missing/extra/reordered cells.
- Import with explicit `.js` extensions; use `const`/`let`, destructuring, optional chaining.
- Use `createOptimizedPicture` for images and `moveInstrumentation()` when moving nodes.
- Factor shared logic into small `scripts/` ES modules (model: `k811-common.js`).
- For k811 blocks, call `initK811(block)` first and reuse the shared IntersectionObserver reveal.

## CSS
- **Mobile-first**, `min-width` breakpoints at 600/900/1200.
- **Scope every selector to `.{block}`**; use design tokens from `styles/kotak811.css` for k811 blocks.
- Keep global + LCP-critical rules in `styles.css`; push the rest to `lazy-styles.css`.
- Animate **transform/opacity only**; always guard with `prefers-reduced-motion`.

## Authoring (Universal Editor)
- Model meaningful fields with clear labels, sensible grouping, marked optionals; correct field components (`reference`/`text`/`richtext`/`select`/`aem-content`).
- After any `_*.json` edit, run `npm run build:json` and commit the aggregates.

## Performance
- Protect LCP: minimal eager phase; LCP image eager + preloaded (k811-hero pattern); everything else `loading="lazy"`.
- Put martech/non-critical JS in `delayed.js`; rely on per-block code-splitting; avoid new dependencies.
- Measure with PSI on the preview URL; target 100.

## Accessibility
- Semantic HTML, correct heading hierarchy, alt text, keyboard operability, focus management, reduced-motion, AA contrast.

## Security
- Sanitize authored/remote HTML with DOMPurify before `innerHTML`; respect the CSP (`nonce="aem"`, no `eval`); never commit/echo secrets; keep PII/secrets out of Sentry.

## Reuse over reinvention
- Check the existing 50 blocks before creating one. Extend shared blocks via CSS classes / variants / model options; only create a dedicated `k811-*` block when bespoke fidelity would otherwise pollute a shared block. Make additive, backward-compatible changes to shared blocks and smoke-test dependent pages.

## When a task sounds like traditional AEM
Map it, don't build it: Sling Model → `decorate()`; HTL → JS decoration; OSGi service → `scripts/` module; Servlet → published JSON/external API; Dispatcher → `.hlxignore`/`head.html`; Cloud Manager → GitHub Actions; GraphQL/QueryBuilder → `query-index.json`. See the matching `docs/skills/` file.

## Why these are the best practices
Each item maps directly to a real failure mode this project's architecture makes easy to hit: field-collapsing (→ classify by content), the eager/lazy/delayed model (→ LCP discipline), the CI JSON-sync gate (→ always `build:json`), the public client-side surface (→ sanitize + CSP + no secrets), and an AEM-trained model's instinct to reach for Java/Dispatcher (→ the mapping rule). Following them is what keeps the build green, the site fast/accessible, and the code consistent with the other 50 blocks.
