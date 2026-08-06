# 09 · Create OSGi Service 🟡

> **Guardrail — this repo has NO OSGi container (no Java bundles/`@Component`).** In this repo the equivalent is a small, dependency-free ES module in `scripts/`; configuration lives in YAML/HTML files. Use the traditional path only on a real AEMaaCS project.

## Variables
- `{{SERVICE_NAME}}` — e.g. `RevealService` / `RatesClient`
- `{{RESPONSIBILITY}}` — what shared logic it provides
- `{{CONFIG}}` — configurable values (optional)
- `{{STACK}}` — `eds` or `aemaacs`

## Prompt
```
I want a shared "service" `{{SERVICE_NAME}}` responsible for: {{RESPONSIBILITY}}. Config: {{CONFIG}}.

FIRST detect the stack (or use STACK={{STACK}}):
- If Edge Delivery Services (THIS repo): do NOT create OSGi @Component/@Designate/Java (docs/skills/11-osgi-services.md).
  Implement it as an ES module under scripts/ (model it on scripts/k811/k811-common.js): export small functions,
  no heavy dependencies, `.js` import extensions, tree-shakeable-by-hand. Blocks import and call it.
  Put any config in the appropriate surface: fstab.yaml / helix-query.yaml / helix-sitemap.yaml / head.html / .hlxignore.
  Never modify scripts/aem.js.
- Only if traditional AEMaaCS: create an @Component service (interface + impl), @Designate OSGi config with an
  @ObjectClassDefinition for {{CONFIG}}, and @Reference injection where consumed.

State the detected stack first.
```

## Validation (EDS path)
- [ ] No OSGi/Java; a `scripts/` ES module with small exported functions, no heavy deps, `.js` imports.
- [ ] Config placed in the correct YAML/HTML surface; `aem.js` untouched; lint passes.
