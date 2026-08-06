# 13 · Create Content Fragment Model 🟡

> **Guardrail — this repo has NO Content Fragments / CF Models / GraphQL.** In this repo, structured reusable content = the `fragment` block (transclude an authored page) + block `_{block}.json` models for structured fields + `.json` spreadsheets / `query-index.json` for tabular data. Use the traditional path only on a real AEMaaCS project.

## Variables
- `{{MODEL_NAME}}` — e.g. `Offer`, `TeamMember`
- `{{FIELDS}}` — structured fields with types, e.g. "title (text), body (richtext), icon (reference), validTill (date)"
- `{{REUSE}}` — how it's reused (many pages? a list/grid?)
- `{{STACK}}` — `eds` or `aemaacs`

## Prompt
```
I want structured, reusable content `{{MODEL_NAME}}` with fields: {{FIELDS}}. Reuse: {{REUSE}}.

FIRST detect the stack (or use STACK={{STACK}}):
- If Edge Delivery Services (THIS repo): do NOT create a CF Model or GraphQL (docs/skills/07-content-fragments.md).
  Map it:
  * "author once, use everywhere" single piece → an authored fragment page referenced via the `fragment` block.
  * structured fields authors edit inline → model {{FIELDS}} in the consuming block's _{block}.json (reference/text/richtext/select/aem-content); run build:json.
  * tabular/repeated data ({{REUSE}} is a list/grid) → a published .json spreadsheet (or query-index.json); fetch + render in the block, sanitizing any HTML.
- Only if traditional AEMaaCS: create a Content Fragment Model with fields {{FIELDS}} (correct data types, validation, variations).

State the detected stack first.
```

## Validation (EDS path)
- [ ] No CF Model / GraphQL artifacts.
- [ ] Reusable content via `fragment` block, or fields in `_{block}.json`, or a published `.json`.
- [ ] `build:json` run if models changed; fetched HTML sanitized.
