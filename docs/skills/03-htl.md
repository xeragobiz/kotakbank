# 03 · HTL / Sightly → JS DOM decoration (mapping skill)

> **This repo has no HTL/Sightly.** There is no HTL runtime, no `.html` component templates, no `data-sly-*` attributes. Do not create `.html` template files as components.

## Purpose
Explain how "templating" works in EDS. In traditional AEM, HTL renders a component's markup server-side from a model. Here, the AEM Edge backend emits **semantic HTML** for sections and blocks, and each block's **`decorate(block)`** function transforms that DOM on the client. Presentation logic lives in JavaScript, not templates.

## When to use
- When a task says "write the HTL / template for this component" → write the block `decorate()` + CSS instead.
- When deciding how markup is produced → read the delivered markup (`…plain.html`), then decorate it.

## Mapping
| HTL construct | EDS equivalent |
|---|---|
| `.html` template file | Semantic HTML from the backend + `blocks/{name}/{name}.js` |
| `data-sly-use` (model) | `import` + `decorate(block)` |
| `data-sly-list` / `data-sly-repeat` | Iterating `block.children` in JS |
| `data-sly-test` (conditionals) | `if`/guard clauses in `decorate()` |
| `${... @ context='html'}` escaping | Sanitize with `scripts/dompurify.min.js` before `innerHTML` |
| Client-side templating in general | Building DOM nodes / `replaceChildren` |

## Best practices
- Read the delivered DOM first (`curl …plain.html`); keep transforms declarative and idempotent.
- **Never inject unsanitized HTML.** When you must set `innerHTML` from authored/remote content, sanitize with DOMPurify (`scripts/dompurify.min.js`).
- Prefer building nodes (`document.createElement`, `replaceChildren`) over string concatenation into `innerHTML`.
- Keep heading hierarchy and semantics intact when restructuring.

## Anti-patterns
- ❌ Creating HTL `.html` component files or `data-sly-*` markup.
- ❌ `element.innerHTML = authoredString` without sanitizing (XSS + CSP risk).
- ❌ Rebuilding markup the backend already provides instead of decorating it.

## Examples
```js
import DOMPurify from '../../scripts/dompurify.min.js';

export default function decorate(block) {
  // was: <div data-sly-list.item="${model.items}">${item.html @ context='html'}</div>
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.innerHTML = DOMPurify.sanitize(row.innerHTML); // sanitize, don't trust
    list.append(li);
  });
  block.replaceChildren(list);
}
```

## Validation checklist
- [ ] No `.html` HTL template / `data-sly-*` artifacts introduced.
- [ ] Markup produced by decorating delivered DOM, not re-templating.
- [ ] Any `innerHTML` from authored/remote content sanitized with DOMPurify.
- [ ] Decoration idempotent; semantics/heading hierarchy preserved.
- [ ] See [01 · Component Development](01-component-development.md) checklist.
