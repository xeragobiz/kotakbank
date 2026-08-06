# Lesson 03 — Sections, Blocks, and the DOM Contract

> Tier 1 · Foundations · Prerequisites: Lessons 01–02

## 1. Theory

Everything EDS renders reduces to three DOM concepts. Master these and the rest of the system is mechanical.

1. **Section** — a top-level grouping of content (`<div class="section">`), created by a document HR. Sections are the unit of vertical page rhythm and section-level styling.
2. **Block** — a reusable, self-contained component (`<div class="<name> block">`) created from a table. A block owns three files: `<name>.js`, `<name>.css`, and (for xwalk) `_<name>.json`.
3. **Default content** — loose content (headings, paragraphs, images, lists, links) that isn't inside a block. It is wrapped in `.default-content-wrapper` and styled globally.

This is the **DOM contract**: given a block table with R rows and C cells, the platform *always* produces a predictable nested-`<div>` structure. Your code reads that structure; it never parses raw text.

### The canonical block DOM

For a two-row, two-cell block:

```html
<div class="cards block" data-block-name="cards" data-block-status="initialized">
  <div>                     <!-- row 1 -->
    <div>…cell 1…</div>
    <div>…cell 2…</div>
  </div>
  <div>                     <!-- row 2 -->
    <div>…cell 1…</div>
    <div>…cell 2…</div>
  </div>
</div>
```

- **Outer div** = the block. Its class list carries the name + any variants.
- **Direct children** = rows.
- **Grandchildren** = cells.
- `data-block-status` moves `initialized → loading → loaded` as the block's JS/CSS load.

## 2. Architecture

`scripts.js` orchestrates decoration in this order (simplified from the boilerplate):

```
loadEager:
  decorateTemplateAndTheme()      // body classes from page metadata
  decorateMain(main):
    decorateButtons()             // <a> in <p> → styled buttons
    decorateIcons()               // :icon-name: → <span class="icon">
    buildAutoBlocks()             // project-specific synthesized blocks
    decorateSections()            // wrap HR-separated content
    decorateBlocks()              // tag tables as blocks, read section metadata
  loadSection(first)              // load ONLY the first section for fast LCP

loadLazy:
  loadSections(rest)              // load remaining sections' blocks
  loadHeader(), loadFooter()
  load lazy-styles.css

loadDelayed:
  import('./delayed.js')          // martech, non-critical
```

**Per-block loading** (`loadBlock`): for each block the platform dynamically `import()`s `blocks/<name>/<name>.js`, injects `blocks/<name>/<name>.css`, awaits the default-exported `decorate(block)`, then flips `data-block-status="loaded"`. This is **automatic code-splitting** — a block's code ships only on pages that use it.

## 3. Engineering rationale

**Why a rigid DOM contract?** Predictability. Because the structure is guaranteed, block code is a pure DOM transform with no parsing ambiguity. It also means blocks are **idempotent-friendly** and testable: same input DOM → same output.

**Why sections as a first-class concept?** They give designers a place to hang page rhythm, backgrounds, and full-bleed treatments without blocks needing to know about their neighbors. Section metadata (Lesson 02) keeps that authorable.

**Why load only the first section eagerly?** LCP almost always lives in the first section. Loading the rest lazily keeps the critical path tiny — the core of "Keeping it 100" (Lesson 07/11).

**Why per-block CSS/JS files?** Code-splitting for free, strong encapsulation (CSS scoped to `.<block>`), and a clean 1:1 mapping between a component and its files that both humans and tools can reason about.

## 4. Examples

**Reading the contract defensively** (preview of Lesson 05):
```js
export default function decorate(block) {
  [...block.children].forEach((row) => {        // rows
    const cells = [...row.children];            // cells
    const [imageCell, textCell] = cells;
    // classify by content, not just position:
    if (imageCell?.querySelector('picture')) imageCell.className = 'card-image';
    if (textCell) textCell.className = 'card-body';
  });
}
```

**Default content vs block:** a stray paragraph with a single link becomes a **button** via `decorateButtons`, no block required:
```html
<p class="button-container"><a href="/apply" class="button">Apply now</a></p>
```

## 5. Hands-on exercises

1. **Contract drill.** Draw the exact `<div>` tree for a 3-row, 1-cell block named `steps (numbered)`. Include the class list on the outer div.
2. **Trace decoration.** List, in order, the `decorate*` functions `loadEager` calls and one sentence on what each does.
3. **Find the LCP.** On a real EDS page, identify which section holds the LCP element and explain why loading it eagerly matters.
4. **Status lifecycle.** Using dev tools, watch a block's `data-block-status` attribute change on load.

## 6. Common mistakes

- **Querying across block boundaries** (`document.querySelector('.card')`) instead of scoping to `block`. Two instances on a page will clash.
- **Assuming grandchildren are always elements** — a cell may hold text nodes, a `<picture>`, or an `<a>`. Guard with optional chaining.
- **Global CSS selectors** (`.card {}`) that leak into other blocks. Always scope: `.cards .card {}`.
- **Doing heavy work in eager phase** for non-first sections, delaying LCP.

## 7. Review questions

1. What three DOM concepts does every EDS page reduce to?
2. In the block DOM, what do the outer div, its children, and grandchildren represent?
3. What does `data-block-status` track, and what are its values?
4. Why does the eager phase load only the first section?
5. How does EDS achieve per-page code-splitting without a bundler?

## 8. Best practices

- **Always scope selectors and queries to the block element.**
- **Read `.plain.html` first**, then write the transform against the real contract.
- **Keep `decorate()` idempotent** and free of side effects outside the block (except deliberate `<head>` preloads for LCP).
- **Respect the phase**: only first-section, LCP-critical work belongs eager.

## 9. Anti-patterns

- **Treating the block like a template engine** — string-building innerHTML from scratch instead of transforming the delivered DOM (loses instrumentation, invites XSS).
- **Cross-block/global selectors** that couple unrelated components.
- **Position-only cell access** with no content classification.
- **Ignoring `prefers-reduced-motion` / accessibility** while transforming (covered in Lesson 12) — the DOM contract is also an a11y contract.

---

**Next:** [Lesson 04 — Project Anatomy & the Boilerplate →](lesson-04-project-anatomy.md)
