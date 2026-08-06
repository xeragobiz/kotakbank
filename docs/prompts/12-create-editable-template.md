# 12 · Create Editable Template 🟡

> **Guardrail — this repo has NO AEM Editable Templates / Template Editor.** In this repo, page structure comes from **authored pages in Universal Editor** plus section/default-content models (`models/_component-*.json`) and the import **page templates** in `tools/importer/page-templates.json`. Use the traditional path only on a real AEMaaCS project.

## Variables
- `{{TEMPLATE_NAME}}` — e.g. `k811-landing`
- `{{SECTIONS}}` — the section/block skeleton, e.g. "hero → pillars → offers → steps → team → footer CTA"
- `{{POLICIES}}` — allowed components / defaults (optional)
- `{{STACK}}` — `eds` or `aemaacs`

## Prompt
```
I want a reusable page template `{{TEMPLATE_NAME}}` with structure: {{SECTIONS}}. Policies: {{POLICIES}}.

FIRST detect the stack (or use STACK={{STACK}}):
- If Edge Delivery Services (THIS repo): do NOT create AEM editable templates / policies / template editor nodes.
  Map it (docs/skills/07 + 12):
  * For migration/import: add/adjust a page template in tools/importer/page-templates.json describing the section/block
    sequence {{SECTIONS}} (blocks[] mapped by the block-mapping step), then use the import tooling — never hand-author content/.
  * For authoring structure/defaults: ensure the needed blocks exist and their _{block}.json models + section/default-content
    models (models/_component-*.json) express the allowed fields; run `npm run build:json`.
- Only if traditional AEMaaCS: create an Editable Template (structure, layout, policies allowing {{POLICIES}}) via the Template Editor conventions.

State the detected stack first.
```

## Validation (EDS path)
- [ ] No editable-template/policy nodes created.
- [ ] Section/block sequence expressed via `tools/importer/page-templates.json` and/or block models.
- [ ] `npm run build:json` run if models changed; content/ not hand-edited.
