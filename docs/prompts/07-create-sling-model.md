# 07 · Create Sling Model 🟡

> **Guardrail — this repo has NO Sling Models (no Java).** In this repo, the equivalent of a Sling Model is a block's `decorate(block)` function. Keep the guardrail line in the prompt so the assistant redirects instead of scaffolding Java. Use the traditional path only on a genuine AEMaaCS project.

## Variables
- `{{MODEL_NAME}}` — e.g. `PromoBannerModel`
- `{{PROPERTIES}}` — fields to expose, e.g. "title (String), ctaHref (String), items (List)"
- `{{RESOURCE_TYPE}}` — component resourceType (AEMaaCS only)
- `{{STACK}}` — `eds` or `aemaacs`

## Prompt
```
I want a "Sling Model" for {{MODEL_NAME}} exposing: {{PROPERTIES}}.

FIRST detect the stack (or use STACK={{STACK}}):
- If this is an Edge Delivery Services repo (blocks/, scripts/aem.js, no pom.xml — THIS repo):
  Do NOT create Java or @Model classes. Implement the equivalent as a block decorate(block) function
  (docs/skills/02-sling-models.md): read {{PROPERTIES}} by classifying the block's DOM cells by content,
  build the view DOM, keep it idempotent. Share cross-block logic via a scripts/ ES module, not a service.
  Deliver blocks/{name}/{name}.js (+ .css, _{name}.json). Run build:json + lint.
- Only if traditional AEMaaCS (pom.xml present): create a @Model(adaptables=SlingHttpServletRequest.class)
  class with @ValueMapValue/@Inject fields for {{PROPERTIES}}, resourceType {{RESOURCE_TYPE}}, and Sling-Model best practices (interfaces, @PostConstruct, null-safety).

State the detected stack before generating.
```

## Validation (EDS path)
- [ ] No Java produced; logic in `decorate(block)`, reading cells by content.
- [ ] Idempotent/defensive; shared logic in a `scripts/` module; build:json + lint done.
