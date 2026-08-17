# 09 · Anti-patterns, Best Practices, Common Mistakes & Validation

The consolidated do/don't chapter and the master validation checklist. Reasoning attached throughout.

## Best practices (the positive playbook)
| Practice | Why |
|---|---|
| Read delivered markup (`.plain.html`) before coding | the DOM is backend-emitted and variable; assumptions break blocks |
| Design the content model before code | it's the author contract; changing it later breaks authored content |
| Classify cells by content, not index | field-collapsing varies cell counts |
| Decorate defensively + idempotently | authors omit fields; UE re-decorates |
| Scope all CSS to `.{block}`; mobile-first; tokens | prevents leaks; matches majority traffic; enables rebrands |
| Reuse blocks / add variants before new blocks | fewer blocks = smaller, consistent surface |
| LCP image eager+preloaded; everything else lazy | LCP is the critical path |
| Martech in delayed phase | non-critical; protects LCP |
| Sanitize injected HTML; respect CSP; no secrets | public client code |
| `build:json` after model changes | CI gate; aggregates are build output |
| Verify on preview + PSI at 3 widths | localhost/chat isn't delivery |

## Anti-patterns (never do these)
| Anti-pattern | Why it's wrong | Instead |
|---|---|---|
| Editing `scripts/aem.js` | platform core; overwritten; breaks decoration | build in `scripts/` modules / blocks |
| Hand-editing `content/` | not reproducible; fights authoring | use authoring / import tooling |
| Hand-editing `component-*.json` | generated; CI fails | edit `_*.json` + `build:json` |
| Introducing Java/HTL/OSGi/Dispatcher | none exist in EDS | use the JS/YAML/CDN equivalents |
| Index-based cell reads (`cells[2]`) | breaks on field-collapsing | classify by content |
| Bare / `-container` / `-wrapper` selectors | leak site-wide; section-owned | scope to `.{block}` |
| Animating width/top/left | layout thrash + CLS | transform/opacity + reduced-motion |
| Eager-loading non-LCP images / lazy LCP | wrecks LCP | eager only the LCP image |
| Martech/heavy deps in eager | blocks LCP | delayed phase / drop the dep |
| Blocking prose that's just prose | over-engineering; harder to author | default content |
| `innerHTML` of authored HTML unsanitized | XSS + CSP violation | DOMPurify |
| Committing/echoing secrets | public repo; leak | injected credentials via Settings opt-in |

## Common mistakes (subtler, ordered by frequency)
1. **Forgetting `npm run build:json`** after a model edit → CI JSON-sync gate fails. *Fix:* run it; commit aggregates.
2. **Non-idempotent decoration** that works once, corrupts on re-decorate in UE. *Fix:* rebuild deterministically.
3. **Missing `moveInstrumentation()`** when moving nodes → author loses in-place editing. *Fix:* call it.
4. **Desktop-first CSS** shrunk to mobile → mobile bugs. *Fix:* mobile-first.
5. **Dropping metadata/redirects** in migration → silent SEO loss weeks later. *Fix:* inventory + verify.
6. **Hiding tab/accordion/FAQ content** behind interaction so crawlers miss it. *Fix:* keep it in the DOM.
7. **Screenshotting for routine checks** → token waste. *Fix:* `snapshot`/`evaluate`.
8. **Creating a near-duplicate block** instead of a variant. *Fix:* `select` field + CSS.

## Master validation checklist (walk before every PR)
**Architecture & code**
- [ ] `scripts/aem.js` untouched; `content/` not hand-edited; aggregates generated (not hand-edited).
- [ ] No Java/HTL/OSGi/Dispatcher artifacts.
- [ ] Delivered markup inspected before coding.

**Blocks & decorate**
- [ ] Content model designed first; reuse/variant checked before new block.
- [ ] Cells classified by content; defensive; idempotent; `moveInstrumentation()` on moved nodes.

**Markup/CSS/JS**
- [ ] Semantic HTML + heading hierarchy; injected HTML sanitized.
- [ ] CSS scoped to `.{block}`, mobile-first 600/900/1200, tokens, no `-container`/`-wrapper`.
- [ ] JS: `.js` imports, LF, JSDoc, no unjustified deps; `npm run lint` passes.

**Performance & caching**
- [ ] Eager = LCP only; martech delayed; LCP image eager+preloaded, others lazy.
- [ ] Images via `createOptimizedPicture`; assets optimized; critical vs lazy CSS split.
- [ ] PSI on preview (target 100); LCP≤2.5s, CLS≤0.1, healthy INP at 3 widths.

**Accessibility**
- [ ] One `<h1>`, no skips; alt text; keyboard-operable interactive blocks; correct ARIA; reduced-motion; AA contrast; labeled forms.

**Authoring, metadata, delivery**
- [ ] Model semantic/typed/optionals-marked; `build:json` run; block editable in the target surface.
- [ ] Per-page metadata authored; `helix-query.yaml` lean; structured data where relevant; redirects mapped.
- [ ] Feature branch; `gh pr checks` green; Code Sync published; PR includes preview link; no in-band secrets.

## Why this chapter is a table-heavy quick-reference
During real work the engineer needs the *rule and its reason* at a glance, not an essay. The best-practice/anti-pattern/mistake triad plus one master checklist is the executable distillation of the whole handbook — the chapters explain *why*, this chapter is what you actually run down before shipping.
