# Lesson 05 — Block Development: the `decorate()` Function

> Tier 2 · Core Engineering · Prerequisites: Lessons 03–04

## 1. Theory

A **block** is the EDS unit of custom behavior. Its heart is a single default-exported function:

```js
export default function decorate(block) { /* transform the DOM in place */ }
```

`decorate` receives the block's outer `<div>` (the DOM contract from Lesson 03) and **mutates it into the finished component**. There is no template, no render loop, no virtual DOM — you reshape the real nodes the platform already produced. This is the EDS equivalent of a Sling Model + HTL template collapsed into one client-side function.

Three properties define a *good* decorate:
- **Defensive** — tolerates missing, extra, or reordered cells (authors and field-collapsing guarantee variability).
- **Idempotent** — running it twice yields the same result (Universal Editor may re-decorate on edit).
- **Self-contained** — touches only `block` (and, deliberately, `<head>` for LCP preloads); no global side effects.

## 2. Architecture

The platform calls your block through `loadBlock` (in `aem.js`):

```
loadBlock(block):
  status = "loading"
  await import('../blocks/<name>/<name>.js')     // dynamic, code-split
  loadCSS('../blocks/<name>/<name>.css')         // parallel
  await decorate(block)                          // YOUR function (may be async)
  status = "loaded"
```

So `decorate` may be `async` — return a promise and the platform awaits it (useful for fetching a fragment or a JSON endpoint). Because CSS loads in parallel, don't measure layout synchronously at the top of `decorate` expecting final styles.

**Instrumentation:** In Universal Editor projects, DOM nodes carry editing instrumentation (data attributes linking them to author fields). When you *move* nodes, use `moveInstrumentation(from, to)` from `scripts.js` so the WYSIWYG overlays stay attached. Rebuilding innerHTML from scratch **destroys** instrumentation — avoid it.

## 3. Engineering rationale

**Why transform instead of template?** The content already arrived as valid, accessible, indexable HTML. Transforming preserves that (SEO, a11y, no flash of unstyled/empty content) and keeps author instrumentation intact. Templating from scratch throws away all three.

**Why defensive/content-classified parsing?** Universal Editor *field-collapsing* merges a link and its text into one cell, and authors omit optional fields — so cell **counts and positions vary**. Classifying cells by *what they contain* (a `<picture>` → image; rich text → copy; an `<a>` → CTA) is robust where `cells[2]` is not.

**Why idempotent?** UE re-runs decoration after inline edits; a non-idempotent block doubles its DOM or throws on the second pass.

## 4. Examples

**Content-classified, defensive decoration** (the project's `k811-hero` pattern):
```js
import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Decorate the hero: classify each cell by content, not position.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  rows.forEach((row) => {
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture')) {
        cell.classList.add('hero-media');
      } else if (cell.querySelector('a')) {
        cell.classList.add('hero-cta');
        cell.querySelector('a')?.classList.add('button');
      } else if (cell.textContent.trim()) {
        cell.classList.add('hero-copy');
      }
    });
  });
}
```

**Async block that loads a fragment:**
```js
export default async function decorate(block) {
  const path = block.querySelector('a')?.getAttribute('href');
  if (!path) return;                         // defensive: no link, no work
  const resp = await fetch(`${path}.plain.html`);
  if (!resp.ok) return;                      // defensive: tolerate failure
  const html = await resp.text();
  block.innerHTML = window.DOMPurify.sanitize(html);  // sanitize remote HTML
}
```

**Preserving instrumentation while restructuring:**
```js
import { moveInstrumentation } from '../../scripts/scripts.js';
const li = document.createElement('li');
moveInstrumentation(cell, li);   // keep UE editing overlay attached
li.append(...cell.childNodes);
```

**Optimized, lazy images (non-LCP):**
```js
const pic = createOptimizedPicture(src, alt, false, [{ width: '750' }]);
pic.querySelector('img').loading = 'lazy';
```

## 5. Hands-on exercises

1. **Build `promo`.** Given a 1-row, 3-cell block (image, heading+text, link), write a defensive `decorate` that classifies cells and turns the link into a `.button`. Handle a missing image gracefully.
2. **Make it idempotent.** Add a guard so running your `decorate` twice doesn't duplicate the button or re-wrap cells.
3. **Async variant.** Extend `promo` to optionally pull copy from a fragment path if the text cell is empty.
4. **Instrumentation.** Restructure the block's cells into a `<figure>`/`<figcaption>` while preserving instrumentation with `moveInstrumentation`.
5. **Verify.** Run the dev server and confirm the block renders on a draft page at mobile and desktop widths.

## 6. Common mistakes

- **`block.innerHTML = '…'` from scratch** — destroys instrumentation, drops event listeners, and risks XSS if content is involved.
- **`cells[2]`-style positional access** with no fallback — breaks on field-collapsing/omitted fields.
- **Non-idempotent transforms** that double DOM on re-decoration.
- **Unsanitized `innerHTML`** from authored/remote content (always `DOMPurify.sanitize`).
- **Global queries** (`document.querySelector`) instead of `block.querySelector`.
- **Missing `.js` extension** in imports — the linter (Airbnb + local override) requires it.

## 7. Review questions

1. What single argument does `decorate` receive, and what is your job with it?
2. Why classify cells by content rather than index? Name the two forces that make positions unreliable.
3. When and why would `decorate` be `async`?
4. What does `moveInstrumentation` preserve, and when must you call it?
5. Why is rebuilding `innerHTML` from scratch discouraged (give three reasons)?

## 8. Best practices

- **JSDoc every `decorate`** (match the existing blocks' density).
- **Classify by content; tolerate absence.** Never throw on a null cell.
- **Use `createOptimizedPicture`** for images; `loading="lazy"` for everything except the LCP image.
- **Keep it idempotent and block-scoped.** Deliberate `<head>` preloads for the LCP image are the only sanctioned outside effect.
- **Import with explicit `.js` extensions.**
- **Sanitize any injected HTML** with `dompurify`.

## 9. Anti-patterns

- **The "framework in a block"** — pulling in React/state libraries to render a block.
- **String-template rebuild** of the block DOM (loses instrumentation + a11y + SEO).
- **Shared mutable global state** across blocks.
- **Synchronous network or layout thrash** inside `decorate` on the eager path.
- **Duplicating an existing block** instead of adding a variant/model option (check the existing ~50 first).

---

**Next:** [Lesson 06 — CSS Architecture & Responsive Design →](lesson-06-css-architecture.md)
