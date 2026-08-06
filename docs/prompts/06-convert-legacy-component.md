# 06 · Convert Legacy Component 🟢

**Purpose:** Migrate a legacy component (traditional AEM HTL/Sling, or an original website section) into an EDS block in this repo.

## Variables
- `{{SOURCE}}` — what you're converting: a legacy HTL/Sling component path, or an original page section URL
- `{{SOURCE_MARKUP}}` — paste the legacy HTL / rendered HTML (optional)
- `{{BLOCK_NAME}}` — target EDS block name, e.g. `k811-pillars`
- `{{FIDELITY_URL}}` — original page to match visually (optional)

## Prompt
```
Convert the legacy component {{SOURCE}} into an Edge Delivery Services block `{{BLOCK_NAME}}` in this repo.
Legacy source (if provided):
---
{{SOURCE_MARKUP}}
---

Rules (docs/skills/03-htl.md + 01-component-development.md):
1. This repo has NO HTL/Sling/Java. Do NOT port .html templates, data-sly-*, Sling Models, or dialogs verbatim.
2. Map the legacy structure to the EDS model:
   - HTL model props → authored fields in _{{BLOCK_NAME}}.json (Universal Editor).
   - data-sly-list/repeat → iterate block.children in decorate(block).
   - data-sly-test → guard clauses.
   - HTL escaping → sanitize any authored/remote HTML with scripts/dompurify.min.js before innerHTML.
3. Produce blocks/{{BLOCK_NAME}}/{{BLOCK_NAME}}.{js,css} + _{{BLOCK_NAME}}.json. decorate() classifies cells by content, is idempotent/defensive; CSS scoped + mobile-first; images via createOptimizedPicture; k811 blocks call initK811.
4. Match {{FIDELITY_URL}} visually if provided (content + design parity).
5. Run `npm run build:json`, `npm run lint`, verify preview at mobile/tablet/desktop.

Summarize the mapping from legacy constructs → EDS equivalents.
```

## Validation
- [ ] No HTL/Sling/Java ported; logic lives in decorate() + model JSON.
- [ ] Fields mapped to `_{block}.json`; HTML sanitized where injected.
- [ ] Visual/content parity with source; build:json + lint + preview done.
