# 03 · Create Component 🟢 / 🟡

**Purpose:** Generic "create a component" prompt. A component in **this repo** = an EDS block; on a traditional AEMaaCS project = HTL + Sling Model + dialog. The prompt auto-routes.

## Variables
- `{{COMPONENT_NAME}}` — e.g. `promo-banner` / `k811-steps`
- `{{COMPONENT_PURPOSE}}` — what it renders
- `{{FIELDS}}` — authored fields
- `{{STACK}}` — `eds` (this repo) or `aemaacs` (traditional)

## Prompt
```
Create a component named `{{COMPONENT_NAME}}` that renders {{COMPONENT_PURPOSE}} with fields: {{FIELDS}}.

Detect the stack first (or use STACK={{STACK}}):
- If this is an Edge Delivery Services repo (has blocks/, scripts/aem.js, no pom.xml — THIS repo):
  Build it as an EDS block. Follow docs/prompts/01-create-eds-block.md exactly:
  blocks/{{COMPONENT_NAME}}/{{COMPONENT_NAME}}.{js,css} + _{{COMPONENT_NAME}}.json, decorate(block) that
  classifies cells by content, scoped mobile-first CSS, run `npm run build:json` + `npm run lint`, verify preview.
  Do NOT create Java/HTL/dialog artifacts.
- Only if this is a traditional AEMaaCS project (has pom.xml, ui.apps): scaffold HTL + Sling Model + dialog +
  clientlib per Adobe Core Component conventions.

State which stack you detected before generating anything.
```

## Validation (EDS path)
- [ ] Stack detected & stated; EDS block created (not Java/HTL).
- [ ] See 01-create-eds-block.md validation.
