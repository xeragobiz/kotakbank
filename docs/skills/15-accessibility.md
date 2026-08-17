# 15 · Accessibility

## Purpose
Ensure every block and page meets **WCAG 2.1 AA**: semantic HTML, correct heading hierarchy, alt text, ARIA where needed, keyboard operability, and reduced-motion support.

## When to use
- Building/modifying any block, especially interactive ones (modals, carousels, tabs, accordions).
- Adding images, animations, or custom controls.
- Before opening a PR (accessibility is part of Definition of Done).

## Best practices
- **Semantic HTML5** and correct heading hierarchy (don't skip levels); preserve semantics when restructuring the DOM.
- **Alt text** on all meaningful images; empty `alt=""` for decorative ones.
- **ARIA only where native semantics don't suffice**; prefer native elements (`<button>`, `<a>`, `<dialog>`).
- **Keyboard operability** for interactive blocks: focus management, visible focus, `Esc` to close, Tab order, no keyboard traps (the shared `eligibility-modal.js` pattern).
- **Reduced motion:** wrap animations in `@media (prefers-reduced-motion: no-preference)`; the shared reveal already respects this.
- **Contrast:** meet AA contrast ratios; verify against the kotak811 design tokens.
- Label form controls; associate errors with fields.

## Anti-patterns
- ❌ `<div onclick>` instead of `<button>`; clickable elements not keyboard-reachable.
- ❌ Missing/auto-generated meaningless `alt`; images of text without alternatives.
- ❌ Skipped heading levels or multiple `<h1>`s per page.
- ❌ ARIA that contradicts native semantics (`role="button"` on an `<a>` etc.).
- ❌ Motion with no `prefers-reduced-motion` guard; focus lost when opening/closing modals.

## Examples
```js
// Accessible toggle
const btn = document.createElement('button');
btn.setAttribute('aria-expanded', 'false');
btn.addEventListener('click', () => {
  const open = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!open));
  panel.hidden = open;
});
// Esc closes, focus returns to trigger (modal pattern)
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
```

## Validation checklist
- [ ] Semantic elements; correct, unskipped heading hierarchy; single `<h1>`.
- [ ] All meaningful images have `alt`; decorative images `alt=""`.
- [ ] Interactive blocks fully keyboard-operable; visible focus; `Esc` closes; no traps.
- [ ] ARIA used only where needed and consistent with semantics.
- [ ] Animations guarded by `prefers-reduced-motion`.
- [ ] Contrast meets AA; form controls labeled.
