# 07 · Block / Component Generation

How the assistant generates EDS blocks that are correct on the first render.

## The generation contract (what a block *is*)
Three files, one folder: `blocks/{name}/{name}.js` (default `decorate(block)`), `{name}.css` (scoped), `_{name}.json` (Universal Editor model). The assistant must produce all three coherently — code that reads the model's fields, CSS scoped to the block, model labels authors understand.

## The generation procedure (ordered, with rationale)
1. **Detect stack** → must be EDS ([02](02-domain-knowledge-model.md)); else redirect.
2. **Check for reuse** → grep existing blocks; prefer variant/model option over a new block. *Why:* consistency + smaller surface.
3. **Design the content model first** → decide rows/cells/fields (the author↔code contract) before code. *Why:* the model is the interface; changing it later breaks authored content.
4. **Read delivered markup** → if the block will run on an existing page, `curl …plain.html` to see real cell structure. *Why:* field-collapsing varies cell counts.
5. **Write `decorate(block)`** → classify cells by content, defensive, idempotent; images via `createOptimizedPicture`; `moveInstrumentation()` on moved nodes; k811 blocks call `initK811`.
6. **Write scoped CSS** → mobile-first, `.{name}`-scoped, tokens not magic numbers, transform/opacity animations with `prefers-reduced-motion`.
7. **Write `_{name}.json`** → correct field components, author-friendly labels; then `npm run build:json`.
8. **Verify** → lint + render at 3 widths ([09](09-verification-and-validation.md)).

## The critical technique: classify cells by content, not index
Because Universal Editor collapses link+text field pairs, the rendered cell count is unstable. The assistant must generate code like:
```js
const imageCell = cells.find((c) => c.querySelector('picture, img'));
const ctaCell   = cells.find((c) => c.querySelector('a'));
const copyCell  = cells.find((c) => c !== imageCell && c.textContent.trim() && !c.querySelector('a'));
```
never `const title = cells[1]`. *Why this is the #1 block bug:* index-based code passes in the demo and breaks the moment an author omits an optional field or the collapser merges cells. Training the generator to *always* classify is the single most impactful block-quality rule.

## Defensive & idempotent decoration (non-negotiable)
- Guard every field (`if (img) …`) — authors omit optionals.
- Rebuild deterministically (`block.textContent = ''; block.append(inner)`) so re-decoration (Universal Editor re-runs it) is safe.
- Never throw on a null cell.
*Why:* EDS re-decorates during authoring; a non-idempotent or fragile block corrupts the live editing experience.

## Variants over new blocks
Add a `select` field, key CSS off the chosen class:
```json
{ "component": "select", "name": "layout", "label": "Layout",
  "options": [{ "name": "Left", "value": "left" }, { "name": "Right", "value": "right" }] }
```
```css
.myblock.right .myblock-inner { flex-direction: row-reverse; }
```
*Why:* fewer blocks = less code, consistent authoring, easier maintenance. Only mint a dedicated block when bespoke fidelity would otherwise pollute a shared one (the documented rationale for this repo's `k811-*` family).

## Performance built into generation
- LCP image: `createOptimizedPicture` + media-scoped preload for heroes; `fetchpriority="high"`; all other images `loading="lazy"`.
- No new dependencies; reuse the shared scroll-reveal observer over animation libs.
*Why:* performance regressions are cheapest to prevent at generation time, not diagnose at PSI time.

## Example: full generation flow (abbreviated)
> "Add a testimonial block: quote, author name, author photo."
```
1 stack=EDS  2 no existing 'testimonial' block  3 model: photo(reference), quote(richtext), name(text)
4 (new block, no existing page) 5 decorate(): classify photo/quote/name, build <figure>+<blockquote>
6 CSS scoped .testimonial, mobile-first  7 _testimonial.json + build:json  8 lint + preview ✓
```
Output: three coherent files, verified — see `docs/EXAMPLES.md` for the real `k811-cta` equivalent.

## Why generation quality lives in *procedure*, not model size
A larger model still writes `cells[1]` if not told the field-collapsing rule. Encoding the ordered procedure and the classify-by-content technique as a **skill** ([04](04-knowledge-and-skills-system.md)) makes correct blocks a property of the *system*, reproducible across models and sessions.
