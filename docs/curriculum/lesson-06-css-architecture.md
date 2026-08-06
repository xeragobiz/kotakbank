# Lesson 06 — CSS Architecture & Responsive Design

> Tier 2 · Core Engineering · Prerequisites: Lessons 03–05

## 1. Theory

EDS CSS is **plain CSS3** — Grid, Flexbox, custom properties, media queries. No Sass, no Tailwind, no CSS-in-JS, no framework. The discipline comes from *conventions*, not tooling:

- **Three stylesheet layers** by loading phase:
  1. `styles/styles.css` — global + **LCP-critical** rules, loaded **eagerly**.
  2. `styles/lazy-styles.css` — below-the-fold, loaded **lazily**.
  3. `blocks/<name>/<name>.css` — per-block, **auto-loaded** when the block appears (code-split).
- **Mobile-first**: base styles target the smallest screen; enhance upward with `min-width` media queries at **600px / 900px / 1200px** (tablet / desktop / large).
- **Scope everything to the block**: `.k811-hero .cta {}`, never a bare `.cta {}`.
- **Design tokens** via CSS custom properties, often in a scoped design-guide stylesheet applied under a page-family root (e.g. `main.kotak811`).

## 2. Architecture

```
head.html                → loads styles.css eagerly (critical path)
scripts.js loadLazy      → injects lazy-styles.css
loadBlock(<name>)        → injects blocks/<name>/<name>.css in parallel with its JS
```

CSS custom properties cascade from a root scope down into blocks:

```css
/* styles/<design-guide>.css — applied only under the page family root */
main.kotak811 {
    --k-font: 'Manrope', system-ui, sans-serif;
    --k-accent: #f0483e;
    --k-space-lg: 4rem;
}
/* blocks/k811-hero/k811-hero.css — consumes tokens, scoped to the block */
.k811-hero {
    font-family: var(--k-font);
    padding-block: var(--k-space-lg);
}
.k811-hero .cta { background: var(--k-accent); }
```

## 3. Engineering rationale

**Why three layers?** To protect **LCP**. Only rules needed to paint the first screen ship eagerly; everything else defers. Per-block CSS means a block's styles cost nothing on pages that don't use it (automatic code-splitting again).

**Why mobile-first with `min-width`?** The smallest device gets the simplest, cheapest CSS by default; larger screens *add* rules. This avoids shipping desktop complexity to phones and matches how the platform prioritizes the mobile critical path.

**Why scope to the block?** Blocks are reusable and appear alongside arbitrary other blocks. A bare `.cta {}` leaks and collides; `.k811-hero .cta {}` is safe and self-documenting.

**Why forbid `-container`/`-wrapper` selectors?** The platform generates `.<block>-wrapper` and `.section` wrappers itself; targeting them couples your CSS to platform-generated scaffolding and causes confusion between *your* block root and the *platform's* wrapper. Style `.k811-hero`, not `.k811-hero-wrapper`.

**Why custom properties over Sass variables?** They're runtime, cascade-aware, themeable per section, and need no build step — a perfect fit for a no-build platform.

## 4. Examples

**Mobile-first responsive block:**
```css
/* base = mobile */
.cards { display: grid; gap: 1rem; grid-template-columns: 1fr; }

@media (min-width: 600px) {   /* tablet */
    .cards { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 900px) {   /* desktop */
    .cards { grid-template-columns: repeat(3, 1fr); gap: 2rem; }
}
```

**Compositor-friendly, reduced-motion-safe animation:**
```css
.k811-story { opacity: 0; transform: translateY(24px); transition: opacity .5s, transform .5s; }
.k811-story.is-visible { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
    .k811-story { opacity: 1; transform: none; transition: none; }
}
```

**Section-metadata-driven variant** (from Lesson 02):
```css
.section.highlight { background: var(--k-accent); color: #fff; }
```

## 5. Hands-on exercises

1. **Responsive grid.** Write mobile-first CSS for a `features` block: 1 column < 600px, 2 columns 600–899px, 4 columns ≥ 1200px.
2. **Scope audit.** Given `.title { font-size: 3rem; }` in a block file, rewrite it correctly scoped, and explain what could break with the original.
3. **Token refactor.** Extract three hard-coded values (a color, a font, a spacing) into custom properties on a page-family root and consume them in a block.
4. **Layer placement.** Decide which of these rules belong in `styles.css` vs `lazy-styles.css` vs a block file: hero background, footer link hover, global typography, a modal's styles.
5. **Reduced motion.** Add a `prefers-reduced-motion` guard to an existing animated block and verify with dev tools emulation.

## 6. Common mistakes

- **Unscoped selectors** (`.cta`, `.title`) leaking across blocks.
- **Targeting `-container`/`-wrapper`** classes.
- **Desktop-first `max-width` queries** that ship heavy CSS to phones.
- **Animating `top`/`left`/`width`/`height`** (layout-triggering) instead of `transform`/`opacity`.
- **No `prefers-reduced-motion` fallback.**
- **Dumping block-specific CSS into `styles.css`**, bloating the critical path.

## 7. Review questions

1. Name the three CSS layers and when each loads.
2. What are the three standard breakpoints, and why `min-width` rather than `max-width`?
3. Why must every block selector be scoped, and what convention names are banned?
4. Why prefer `transform`/`opacity` for animation?
5. Why are CSS custom properties a better fit than Sass variables in EDS?

## 8. Best practices

- **Mobile-first**, breakpoints at 600/900/1200.
- **Scope every selector** to `.<block>`; never `-container`/`-wrapper`.
- **Tokens via custom properties** on a scoped root; consume in blocks.
- **Keep `styles.css` to global + LCP-critical**; block CSS handles the rest.
- **Animate compositor properties only**, always with a reduced-motion fallback.
- **4-space indent** for CSS per `.editorconfig`; pass Stylelint standard.

## 9. Anti-patterns

- **A CSS framework or utility-class system** bolted on (defeats no-build simplicity and bloats payload).
- **Global "reset"/override files** fighting the platform's base styles.
- **`!important` wars** caused by unscoped selectors.
- **Inline styles from JS** for things CSS should own (harder to theme, breaks reduced-motion handling).

---

**Next:** [Lesson 07 — The Three-Phase Loading Model →](lesson-07-three-phase-loading.md)
