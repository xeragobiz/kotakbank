# Lesson 12 — Accessibility & Progressive Enhancement

> Tier 4 · Performance, Quality & Delivery · Prerequisites: Lessons 03, 05, 11

## 1. Theory

EDS's content-first model gives you accessibility *for free* — if you don't break it. Because content arrives as semantic HTML before any JS, the page is readable by assistive tech at first paint. Your job in `decorate()` is **progressive enhancement**: add design and interactivity *without* removing meaning, structure, or keyboard operability.

Target: **WCAG 2.1 AA**. The pillars:
- **Semantic structure** — correct heading hierarchy (one `<h1>`, no skipped levels), landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), lists for lists.
- **Text alternatives** — `alt` on meaningful images, empty `alt=""` on decorative ones.
- **Keyboard operability** — everything usable without a mouse; visible focus; logical tab order.
- **ARIA only when needed** — prefer native elements; add ARIA to fill gaps, never to paper over non-semantic markup.
- **Respect user preferences** — `prefers-reduced-motion`, sufficient color contrast, no reliance on color alone.

## 2. Architecture — where a11y lives in the pipeline

```
Content source → semantic HTML (headings, lists, links, alt)   ← a11y baseline (free)
      │
decorate(block) → enhance, MUST preserve semantics + keyboard   ← where you can break it
      │
CSS → focus styles, contrast, prefers-reduced-motion            ← visual a11y
```

Interactive blocks (accordions, tabs, carousels, modals) are where most a11y is *added*: roles, `aria-expanded`, focus management, `Esc` to close, focus trap for modals, arrow-key navigation.

## 3. Engineering rationale

**Why progressive enhancement over "build the widget in JS"?** If interactivity is layered on semantic HTML, the page still works when JS is slow, fails, or is unsupported by an AT — and it's indexable. Building from an empty `<div>` up means no-JS = no content, which is both an a11y and SEO failure.

**Why prefer native elements + minimal ARIA?** Native `<button>`, `<a>`, `<details>`, `<nav>` come with keyboard behavior, focus, and roles built in. ARIA is a *promise* you must fulfill in JS; misused ARIA is worse than none. "No ARIA is better than bad ARIA."

**Why honor `prefers-reduced-motion`?** Vestibular disorders make large motion physically harmful. It's a WCAG requirement and trivial to support — one media query disabling transforms/transitions.

**Why does this matter commercially?** For a bank like Kotak811, AA is often a legal/regulatory requirement, and accessibility overlaps heavily with SEO and overall robustness. It's not optional polish.

## 4. Examples

**Accessible accordion enhancement (progressive):**
```js
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [head, panel] = row.children;
    const btn = document.createElement('button');
    btn.setAttribute('aria-expanded', 'false');
    btn.append(...head.childNodes);
    head.replaceWith(btn);
    const region = document.createElement('div');
    region.hidden = true;
    region.append(...panel.childNodes);
    panel.replaceWith(region);
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      region.hidden = open;
    });
  });
}
```

**Modal focus + Esc (essentials):**
```js
dialog.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
const focusable = dialog.querySelectorAll('a,button,input,[tabindex]:not([tabindex="-1"])');
focusable[0]?.focus();   // move focus in; trap within on Tab; restore on close
```

**Reduced motion (CSS):**
```css
@media (prefers-reduced-motion: reduce) {
  .k811-story, .k811-story.is-visible { transition: none; transform: none; opacity: 1; }
}
```

**Decorative vs meaningful images:**
```html
<img src="hero.png" alt="Open a Kotak811 account in 5 minutes">   <!-- meaningful -->
<img src="swirl.svg" alt="">                                       <!-- decorative -->
```

## 5. Hands-on exercises

1. **Heading audit.** A page has `h1 → h3 → h2`. Explain the problems and correct the hierarchy.
2. **Keyboardize.** Given a tab block built from `<div>`s with click handlers, convert to keyboard-operable tabs (roles, arrow keys, focus).
3. **Reduced motion.** Add a `prefers-reduced-motion` guard to an animated reveal and verify with dev tools emulation.
4. **Alt text.** For a hero photo, a brand logo link, and a decorative divider, write appropriate `alt` values.
5. **Contrast.** Check a `--k-accent` button's text contrast against AA (4.5:1 body / 3:1 large) and adjust if failing.

## 6. Common mistakes

- **`<div>`/`<span>` with click handlers** instead of `<button>`/`<a>` — no keyboard, no role.
- **Skipped/duplicated heading levels.**
- **Missing or unhelpful `alt`** ("image1.png"); decorative images with non-empty alt.
- **No visible focus** (removing outlines without a replacement).
- **ARIA without behavior** (`aria-expanded` that never updates).
- **No reduced-motion path.**

## 7. Review questions

1. Why does content-first give an accessibility head start, and where can you lose it?
2. Why prefer native elements and minimal ARIA?
3. What must an accessible modal do beyond looking modal?
4. When is `alt=""` correct?
5. Why is `prefers-reduced-motion` both an ethical and a compliance concern?

## 8. Best practices

- **Preserve semantics** through decoration; enhance, don't replace.
- **Native elements first**, ARIA only to fill real gaps.
- **Full keyboard support** + visible focus for every interactive block.
- **Meaningful `alt`; empty for decorative.**
- **Honor `prefers-reduced-motion`** and meet AA contrast.
- **Test with keyboard-only and a screen reader**, not just automated tools.

## 9. Anti-patterns

- **Div-soup widgets** driven entirely by mouse events.
- **ARIA as a band-aid** over non-semantic markup.
- **Motion with no opt-out.**
- **Focus loss** (modals that don't trap/restore focus).
- **Color-only signaling** (e.g., red text as the only error indicator).

---

**Next:** [Lesson 13 — Testing, Linting & CI/CD →](lesson-13-testing-cicd.md)
