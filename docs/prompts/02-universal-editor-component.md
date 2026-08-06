# 02 · Universal Editor Component 🟢

**Purpose:** Author or update a block's Universal Editor model (`_{block}.json`) so content authors can edit it.

## Variables
- `{{BLOCK_NAME}}` — existing/new block, e.g. `k811-hero`
- `{{FIELDS}}` — list of authored fields with type + label, e.g. "image (reference, 'Background'), heading (text), body (richtext), ctaLink (aem-content), ctaText (text)"
- `{{VARIANTS}}` — optional select options (e.g. "layout: left / right / center") or "none"
- `{{GROUPS}}` — optional field grouping, e.g. "Content, Call to action, Layout"

## Prompt
```
Create/update the Universal Editor model for block `{{BLOCK_NAME}}` in blocks/{{BLOCK_NAME}}/_{{BLOCK_NAME}}.json.

Fields authors should edit: {{FIELDS}}.
Variant options: {{VARIANTS}}.
Field grouping: {{GROUPS}}.

Requirements (docs/skills/12-universal-editor.md + component-model-definitions):
- `definitions` must use the xwalk plugin resourceType `core/franklin/components/block/v1/block`.
- Use correct field components: `reference` (images/assets), `text`, `richtext`, `select`, `aem-content`.
- Meaningful labels authors understand; sensible grouping; mark optionals clearly.
- If variants are requested, model them as a `select` field and map to a CSS class/variant in the block JS (classify by content; don't read fixed indices).
- After editing, run `npm run build:json` to regenerate component-definition.json / component-models.json / component-filters.json.
- NEVER hand-edit the aggregate JSON files. Run `npm run lint` (plugin:xwalk/recommended must pass).
- In the block JS, use `moveInstrumentation()` when moving nodes so editing overlays survive.

Confirm the block is insertable and editable in the editor.
```

## Validation
- [ ] `resourceType: core/franklin/components/block/v1/block` present.
- [ ] Correct field components; clear labels/grouping; optionals marked.
- [ ] `npm run build:json` run; three aggregates committed & in sync; lint passes.
- [ ] `moveInstrumentation()` used on moved nodes; block editable in UE.
