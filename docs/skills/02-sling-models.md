# 02 · Sling Models → Block `decorate()` (mapping skill)

> **This repo has no Sling Models.** There is no Java, no `@Model`, no `SlingHttpServletRequest`, no adaptables. This skill maps the Sling Model concept to its EDS equivalent so you don't reach for the wrong tool.

## Purpose
Explain where "view logic / model" lives in an EDS project. In traditional AEM a Sling Model exposes data to an HTL template. Here, the AEM Edge backend emits semantic HTML and the **block's default-exported `decorate(block)` function** reads that markup and transforms the DOM. The `decorate` function *is* the model + controller.

## When to use
- Whenever a task is phrased in Sling-Model terms ("create a model to back this component", "expose these properties to the view"). Redirect to block development.
- When deciding where per-component behavior belongs → it belongs in `blocks/{name}/{name}.js`.

## Mapping
| Sling Model concept | EDS equivalent in this repo |
|---|---|
| `@Model(adaptables=...)` class | `export default function decorate(block)` |
| `@Inject` / `@ValueMapValue` properties | Reading cells/rows from the block DOM |
| `@PostConstruct init()` | Body of `decorate()` |
| Model → HTL binding | `decorate()` mutating the live DOM |
| Shared service injected into model | ES module imported from `scripts/` (e.g. `k811-common.js`) |

## Best practices
- Put all component logic in `decorate(block)`; keep it idempotent and side-effect-free outside the block (except intentional `<head>` preloads).
- **Read configuration from the delivered DOM**, classifying cells by content (see [01](01-component-development.md)) — this is the analogue of injecting properties.
- Share cross-block logic via ES modules in `scripts/`, not via a service layer.
- Use `moveInstrumentation()` when relocating nodes so Universal Editor overlays survive.

## Anti-patterns
- ❌ Adding Java, a `core/` bundle, `@Model` classes, or a `pom.xml` — wrong repository if truly needed.
- ❌ Building a separate "data layer" abstraction; the DOM + `decorate()` is the contract.
- ❌ Server-side data assembly — there is no server tier you deploy to here.

## Examples
```js
// The "model" — reading authored values from the block DOM, no Java involved.
export default function decorate(block) {
  const [titleRow, ctaRow] = block.children;
  const title = titleRow?.textContent.trim();      // was @ValueMapValue String title
  const href = ctaRow?.querySelector('a')?.href;   // was @ValueMapValue String ctaHref
  block.replaceChildren(buildView(title, href));    // "view" is DOM you build
}
```

## Validation checklist
- [ ] No Java / Sling artifacts introduced.
- [ ] Logic lives in `blocks/{name}/{name}.js` `decorate()`; idempotent.
- [ ] Values read by classifying DOM cells, defensively (missing cells tolerated).
- [ ] Shared logic factored into a `scripts/` ES module, not a fake service.
- [ ] See [01 · Component Development](01-component-development.md) checklist.
