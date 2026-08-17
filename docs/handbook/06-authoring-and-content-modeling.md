# 06 · Authoring, Content Modeling & Metadata

## The two authoring surfaces
- **Universal Editor (UE):** in-context WYSIWYG; a block's `_{block}.json` model drives the property panel; edits map to the DOM via instrumentation.
- **Document Authoring (DA):** document-based (Word/gdocs-like); blocks are expressed as tables in the document.

- **Recommendation:** know which surface the project uses and design models/markup for it.
  **Why:** they impose different constraints — UE needs preserved instrumentation (`moveInstrumentation()`) and field-based models; DA needs content expressible as document tables. Building for the wrong one produces content authors can't edit.

## Content modeling (the author's interface)
- **Recommendation:** design the model first; use semantic labels ("Video Thumbnail," "CTA Link"), correct field components (`reference`, `richtext`, `text`, `select`, `aem-content`), sensible grouping, clearly-marked optionals.
  **Why:** the model *is* the UI the author sees. Cryptic names ("text1") or wrong types (plain text where richtext is needed) make authoring error-prone. Optionals must be optional in the model so the block can render without them.
- **Recommendation:** keep models stable once content is authored.
  **Why:** renaming/removing a field can orphan or break already-authored content. Model changes are effectively schema migrations.
- **Recommendation:** model variants as a `select`, not as separate blocks.
  **Why:** authors switch variant without a developer, and you avoid near-duplicate blocks. Fewer blocks, more author power.
- **Recommendation:** after any `_*.json` change, run `npm run build:json`; never hand-edit the aggregates.
  **Why:** the platform reads the generated `component-*.json`; CI fails if they're stale. The aggregates are build output, not source.

## Authoring conventions the code must honor
- **Recommendation:** blocks tolerate omitted/reordered fields (classify by content, guard each).
  **Why:** authors don't fill every optional; field-collapsing reorders cells. Code that assumes a fixed shape breaks in real authoring. (See [02](02-blocks-sections-decorate.md).)
- **Recommendation:** put reusable content in a `fragment` and reference it.
  **Why:** shared banners/disclaimers authored once update everywhere; duplicating them across pages guarantees drift.
- **Recommendation:** never hand-edit `content/`.
  **Why:** authored content is produced by authors or the importer; hand-edits aren't reproducible and fight the authoring system.

## Metadata
- **Recommendation:** author per-page metadata (title, description, `og:*`, `robots`, canonical, lang) via page metadata/Metadata block; add fields to `helix-query.yaml` when a block or the sitemap needs them.
  **Why:** metadata drives SEO and social sharing; `helix-query.yaml` selects which meta flows into `query-index.json`, which feeds `helix-sitemap.yaml`. Missing/incorrect metadata silently degrades search visibility.
- **Recommendation:** keep the index lean — index only consumed fields.
  **Why:** every indexed field bloats `query-index.json`, which every consumer (listings, sitemap) downloads.
- **Recommendation:** emit structured data (JSON-LD) where relevant (FAQ, Product, Breadcrumb).
  **Why:** it enables rich results; it's a deliberate SEO asset, not automatic.

## Validation checklist — authoring/modeling/metadata
- [ ] Model designed first; semantic labels; correct field types; optionals marked; variants as `select`.
- [ ] `npm run build:json` run; aggregates in sync (not hand-edited).
- [ ] Block tolerates omitted/reordered fields; reusable content via `fragment`; `content/` not hand-edited.
- [ ] Per-page metadata authored; `helix-query.yaml` indexes consumed fields only; structured data where relevant.
- [ ] Block insertable + editable in the target authoring surface.
