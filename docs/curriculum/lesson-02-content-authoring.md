# Lesson 02 — The Content-First Authoring Model (Documents & DA)

> Tier 1 · Foundations · Prerequisites: Lesson 01

## 1. Theory

EDS is **content-first**. Before a single line of block code exists, there is *content*: a document with headings, paragraphs, images, links, and **tables that become blocks**. Understanding how content becomes structured HTML is the foundation of everything else.

There are three authoring surfaces, all producing the same delivered semantic HTML:

| Surface | Where content lives | Typical project name |
|---|---|---|
| **Document-based** | Google Docs / Word on Drive/SharePoint | "doc" project |
| **Document Authoring (DA)** | `da.live` — a web document editor backed by a Git-like store | "da" project |
| **Universal Editor (xwalk)** | AEM author instance, WYSIWYG on the real page | "xwalk"/"crosswalk" project |

The *authoring UX* differs, but the **content model is the same**: content flows top-to-bottom as **sections** separated by horizontal rules, and structured components are expressed as **tables** (in docs) or block instances (in UE) whose first cell names the block.

### The table = block convention (document authoring)

In a Google Doc / DA, to place a "Cards" block you insert a table:

```
┌─────────────────────────────────────┐
│ Cards                                │   ← first row, first cell = block name
├──────────────────┬──────────────────┤
│ (image)          │ Fast onboarding  │   ← each row = one card
│ (image)          │ Zero balance     │
└──────────────────┴──────────────────┘
```

The platform turns that table into `<div class="cards block">…</div>` with a row per `<div>` and a cell per inner `<div>`. Your block's `decorate()` (Lesson 05) then transforms it.

### Sections

A `---` (horizontal rule) in the document splits the page into **sections**. Each section becomes a `<div class="section">`. **Section metadata** (a small key/value table named `Section Metadata`) lets authors add a style/variant to a whole section without touching code.

## 2. Architecture

```
 Document (Google Doc / Word / DA)                Delivered HTML (/page.plain.html)
 ─────────────────────────────────                ──────────────────────────────────
  # Title                                          <div class="section">
  Intro paragraph                                    <div class="default-content-wrapper">
                                                        <h1>Title</h1><p>Intro…</p>
  ── (horizontal rule) ──                            </div>
                                                    </div>
  ┌ Cards ─────────────┐                            <div class="section">
  │ img │ Fast          │                             <div class="cards-wrapper">
  │ img │ Zero balance  │                               <div class="cards block">…</div>
  └────────────────────┘                             </div>
                                                    </div>
  ── (horizontal rule) ──
  Section Metadata                                   <div class="section highlight">…</div>
  Style │ highlight
```

Key transformation stages performed by the platform + `scripts.js`:
1. **Document → semantic HTML** (done by the content source / `aem.js` pipeline).
2. **`decorateSections`** wraps content between HRs into `.section` divs.
3. **`decorateBlocks`** finds block tables and tags them `<name> block`.
4. **Section metadata** becomes CSS classes on the section.
5. **`decorateDefaultContent`** wraps loose content (headings/paragraphs/images not in a block) into `.default-content-wrapper`.

## 3. Engineering rationale

**Why tables?** Because they are the *one* rich structure every document editor (Docs, Word, DA) supports natively and unambiguously. A table gives authors rows and columns — exactly the repeatable, multi-field structure a block needs — with zero custom UI. It degrades gracefully: even the raw doc is readable.

**Why horizontal rules for sections?** They're a universal, visible, semantic "break" that authors already understand, requiring no special training.

**Why content-first at all?** It forces the **content model to be the contract** between author and developer. If you design the doc structure well, the block code is straightforward. If you skip that step, you get brittle position-dependent code (a recurring anti-pattern). Content-first also means the page is *meaningful and accessible before any JS runs*.

## 4. Examples

**Section Metadata driving a variant** — author adds a table at the end of a section:

```
Section Metadata
Style     | highlight, center
```

Delivered as:
```html
<div class="section highlight center">…</div>
```

CSS can now target `.section.highlight { background: var(--highlight-bg); }` with no code change per page.

**Block with a variant** — the block name cell can carry options in parentheses:
```
Cards (compact)
```
→ `<div class="cards compact block">`, letting one block serve multiple looks.

## 5. Hands-on exercises

1. **Author a page mentally.** Sketch a doc for a landing page with: a hero, a 3-card feature row, and a highlighted CTA section. Mark where the `---` breaks go and which parts are tables.
2. **Predict the DOM.** For your sketch, write the `.plain.html` you expect the platform to deliver (sections, wrappers, block divs).
3. **Variant design.** Choose a block and define two variants (e.g. `cards` and `cards (compact)`). Note what CSS class each produces.
4. **Inspect reality.** On a real EDS site, find a page using a block, view its `.plain.html`, and map each table row/cell to the delivered `<div>`s.

## 6. Common mistakes

- **Hand-writing `content/` HTML.** In this project, files under `content/` are **generated** — never edit them by hand; use import tooling (Lesson 14).
- **Assuming fixed cell counts.** Authors add/remove fields; Universal Editor *field-collapsing* merges link+text pairs, so counts vary. Classify cells by content, not index (Lesson 05).
- **Overusing sections/blocks for plain prose.** Loose headings and paragraphs are "default content" and need no block.
- **Putting styling intent in content.** Content says *what*; a variant/section-style says *how it looks*. Don't encode hex colors in a doc.

## 7. Review questions

1. What document structure becomes a block, and what does the first cell mean?
2. How does an author create a new section without any code?
3. Give two reasons tables were chosen as the block-authoring primitive.
4. Where does the "contract" between author and developer live?
5. Why should block code never rely on a fixed number of cells?

## 8. Best practices

- **Design the content model first** — rows/cells/fields before any JS. It is the contract.
- **Keep authoring simple**: fewest fields that express the design; sensible defaults; clearly optional fields.
- **Use section metadata for section-wide looks** instead of proliferating blocks.
- **Name blocks by meaning** (`hero`, `pillars`, `offers`), not by appearance (`red-box`).

## 9. Anti-patterns

- **Position-coupled parsing** (`cells[2]` is the CTA) — breaks the moment an author reorders or omits a field.
- **One block per page variation** — an explosion of near-identical blocks instead of variants/models.
- **Editing generated content files** to "fix" a page, bypassing the import pipeline — the fix is lost on re-import.
- **Styling via content** (colored text, manual spacing) rather than block CSS/variants.

---

**Next:** [Lesson 03 — Sections, Blocks, and the DOM Contract →](lesson-03-sections-blocks-dom.md)
