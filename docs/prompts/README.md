# Reusable Prompt Library — AEM Development

Copy-paste prompt templates for common AEM tasks. Fill in the `{{PLACEHOLDERS}}`, delete lines you don't need, and paste into your AI assistant.

## ⚠️ Two stacks, one library

This repository is **AEM Edge Delivery Services (EDS)** — vanilla JS/CSS/JSON, no Java/Sling/OSGi/HTL/Dispatcher (see `AGENTS.md`). Several prompts below describe **traditional AEMaaCS** constructs that do **not** exist here.

Each such prompt is tagged and carries a **guardrail block**: used *in this repo*, it redirects to the EDS-native equivalent; used *on a genuine AEMaaCS project*, it works as a normal scaffolding prompt. This keeps every prompt reusable across both worlds without generating code that violates this repo's rules.

| Tag | Meaning |
|---|---|
| 🟢 EDS-native | First-class in this repo; use directly here |
| 🟡 Traditional AEM | Only for a real AEMaaCS project; **in this repo, follow the guardrail → EDS equivalent** |

## Prompts

| # | Prompt | Tag |
|---|---|---|
| 01 | [Create EDS Block](01-create-eds-block.md) | 🟢 |
| 02 | [Universal Editor Component](02-universal-editor-component.md) | 🟢 |
| 03 | [Create Component](03-create-component.md) | 🟢/🟡 |
| 04 | [Fix Build Errors](04-fix-build-errors.md) | 🟢 |
| 05 | [Optimize Performance](05-optimize-performance.md) | 🟢 |
| 06 | [Convert Legacy Component](06-convert-legacy-component.md) | 🟢 |
| 07 | [Create Sling Model](07-create-sling-model.md) | 🟡 |
| 08 | [Create Servlet](08-create-servlet.md) | 🟡 |
| 09 | [Create OSGi Service](09-create-osgi-service.md) | 🟡 |
| 10 | [Create Workflow](10-create-workflow.md) | 🟡 |
| 11 | [Create Dispatcher Rules](11-create-dispatcher-rules.md) | 🟡 |
| 12 | [Create Editable Template](12-create-editable-template.md) | 🟡 |
| 13 | [Create Content Fragment Model](13-create-content-fragment-model.md) | 🟡 |
| 14 | [Create GraphQL Query](14-create-graphql-query.md) | 🟡 |

## How to use
1. Open the prompt file, copy the **Prompt** block.
2. Replace every `{{PLACEHOLDER}}`; remove optional lines that don't apply.
3. Paste to the assistant. For 🟡 prompts in this repo, keep the guardrail line so the assistant redirects instead of scaffolding Java.
