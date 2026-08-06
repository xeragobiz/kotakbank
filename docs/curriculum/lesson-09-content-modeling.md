# Lesson 09 — Content Modeling for Authors

> Tier 3 · Authoring & UE · Prerequisites: Lessons 02, 05, 08

## 1. Theory

**Content modeling** is deciding the *shape* of a block: what rows, cells, and fields an author fills in. It is the highest-leverage design decision in an EDS project, because it is simultaneously:
- the **author's interface** (bad model = daily authoring pain),
- the **developer's contract** (the DOM your `decorate` receives),
- and the **long-term maintenance surface** (models are hard to change once content exists).

The golden rule: **model the content, not the layout.** Fields should describe *meaning* ("headline", "supporting image", "call to action") — never *appearance* ("left column", "red button", "row 2"). Appearance is the job of CSS and variants.

## 2. Architecture

A model flows through the whole system:

```
Model design (fields)      →  _<name>.json (definition+model+filters)
      │                             │ build:json
      ▼                             ▼
Author fills fields in UE   →  delivered block DOM (rows/cells)
      │                             │
      ▼                             ▼
                       decorate(block) reads cells by CONTENT
```

**Field vocabulary** (common UE components):
- `text` — short plain string (labels, names).
- `richtext` — formatted body copy.
- `reference` — an asset (image/video).
- `aem-content` — an internal content path (links).
- `select` — a constrained choice (great for **variants**).
- `boolean` — a toggle (show/hide an element).
- `number`, `date`, etc.

**Variants vs new blocks:** a `select` field (or a variant token in the block name) lets *one* block serve several looks. Prefer that over a second near-identical block.

## 3. Engineering rationale

**Why model meaning, not layout?** Because layout changes (a redesign moves the image from left to right) should be a *CSS* change, not a *content re-authoring* project. If your model says "left image / right text," a redesign forces authors to re-enter content. If it says "image / text," CSS handles the arrangement and content is untouched. This separation is the entire point of content-first.

**Why minimize fields?** Every field is cognitive load and a chance for inconsistency. The best model is the fewest fields that still express the design, with good defaults and clearly optional extras.

**Why prefer variants over new blocks?** Fewer blocks = less code, less CSS, fewer decisions for authors, easier governance. A `select` of `default | compact | inverted` is far cheaper than three blocks. (The exception — a *dedicated* block — is justified when fidelity would otherwise pollute a shared block; that's a deliberate architectural call, Lesson 16.)

**Why is the model hard to change later?** Once authors have created content against a model, changing field names/shapes can orphan existing content. Models deserve upfront design and review — treat them like a database schema.

## 4. Examples

**Good model (meaning-based) for a feature block:**
```json
"fields": [
  { "component": "reference", "name": "image", "label": "Image" },
  { "component": "text",      "name": "title", "label": "Title" },
  { "component": "richtext",  "name": "body",  "label": "Description" },
  { "component": "select",    "name": "layout","label": "Layout",
    "options": [ {"name":"Image left","value":""}, {"name":"Image right","value":"reverse"} ] }
]
```
The `layout` select emits a class the CSS uses — authors choose arrangement without a new block.

**Bad model (layout-based):**
```json
"fields": [
  { "name": "leftColumnImage" },
  { "name": "rightColumnHeadingRedBold" },
  { "name": "row2ButtonOrange" }
]
```
Every redesign breaks this; field names encode CSS.

## 5. Hands-on exercises

1. **Model a testimonial.** Design fields for a testimonial that must support an optional photo and an optional company logo. Mark optionals; avoid layout language.
2. **Variant vs block.** You're asked for a "dark hero." Decide whether to add a `select` variant or a new block; justify in two sentences.
3. **Refactor a bad model.** Rewrite the layout-based feature model above into a meaning-based one plus the CSS class strategy.
4. **Field-type fit.** For each — a CTA link, a body paragraph, a "featured" toggle, a background-style choice — pick the right UE field component.
5. **Migration risk.** Describe what breaks if you rename `title` → `heading` after 200 pages already use the block, and how you'd mitigate it.

## 6. Common mistakes

- **Layout-encoded field names** (`leftImage`, `row2`).
- **Too many fields** — modeling every pixel instead of the content.
- **No optionals / no defaults**, forcing authors to fill everything.
- **A new block per visual tweak** instead of a variant.
- **Changing a live model's field names** without a migration plan.

## 7. Review questions

1. State the golden rule of content modeling in one line.
2. Why should a left/right image arrangement be a variant + CSS, not two fields?
3. When is a *new block* justified over a variant?
4. Why are models expensive to change after launch?
5. Which field component best expresses a constrained set of looks?

## 8. Best practices

- **Model meaning; let CSS/variants own appearance.**
- **Fewest fields**, sensible defaults, clearly-marked optionals.
- **Reuse via `select` variants** before creating a block.
- **Review models like schemas** — they're a long-lived contract.
- **Name fields in author language**, grouped logically.

## 9. Anti-patterns

- **Layout/position/appearance in field names or values.**
- **Block explosion** (dozens of near-duplicates).
- **God-block** with 30 fields trying to be every component.
- **Silent model churn** on live content without migration.

---

**Next:** [Lesson 10 — Metadata, Indexing, Sitemaps & Configuration →](lesson-10-metadata-indexing.md)
