# 01 · Create EDS Block 🟢

**Purpose:** Scaffold a new Edge Delivery Services block (`blocks/{name}/`).

## Variables
- `{{BLOCK_NAME}}` — lowercase-hyphenated (migration blocks use `k811-` prefix), e.g. `k811-offers`
- `{{BLOCK_PURPOSE}}` — what it renders, e.g. "a 3-up grid of offer cards each with icon, title, CTA"
- `{{FIELDS}}` — authored fields per item, e.g. "icon (image), title (text), body (richtext), CTA (link+text)"
- `{{REFERENCE_URL}}` — original page/section to match for fidelity (optional)
- `{{IS_K811}}` — yes/no (does it belong to the kotak811 design system?)

## Prompt
```
Create a new Edge Delivery Services block named `{{BLOCK_NAME}}` that renders {{BLOCK_PURPOSE}}.

Authored content structure (the author↔code contract): {{FIELDS}}.
{{IS_K811}} → if yes, it is a kotak811 design-system block.

Follow this repo's conventions (AGENTS.md + docs/skills/01-component-development.md):
1. First inspect the delivered DOM: `curl http://localhost:3000/{{PATH}}.plain.html`. Do not assume markup.
2. Create blocks/{{BLOCK_NAME}}/{{BLOCK_NAME}}.js with a default-exported, JSDoc'd `decorate(block)`:
   - Classify cells by content, NOT fixed index (picture-only→image, richtext→copy, <a>→CTA).
   - Decorate defensively (tolerate missing/extra/reordered cells) and idempotently.
   - Use `createOptimizedPicture` from ../../scripts/aem.js for images; `.js` import extensions.
   - If a k811 block: call `initK811(block)` from ../../scripts/k811/k811-common.js first and reuse the shared IntersectionObserver reveal (no animation libraries).
   - Use `moveInstrumentation()` when moving nodes.
3. Create blocks/{{BLOCK_NAME}}/{{BLOCK_NAME}}.css: mobile-first, all selectors scoped to `.{{BLOCK_NAME}}`,
   breakpoints at 600/900/1200px, no `-container`/`-wrapper` selectors, animations transform/opacity only + prefers-reduced-motion.
4. Create blocks/{{BLOCK_NAME}}/_{{BLOCK_NAME}}.json (Universal Editor definition + model) then run `npm run build:json`.
5. Match {{REFERENCE_URL}} visually if provided.
6. Run `npm run lint`, then verify rendering in preview at mobile/tablet/desktop.

Do not modify scripts/aem.js. Do not hand-edit files under content/.
```

## Validation
- [ ] Three files created; name lowercase-hyphenated.
- [ ] Cells classified by content; idempotent; defensive.
- [ ] CSS scoped to `.{{BLOCK_NAME}}`; mobile-first; no `-container`/`-wrapper`.
- [ ] `npm run build:json` run; `npm run lint` passes; preview verified.
