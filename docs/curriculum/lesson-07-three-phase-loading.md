# Lesson 07 — The Three-Phase Loading Model (E-L-D)

> Tier 2 · Core Engineering · Prerequisites: Lessons 03–06

## 1. Theory

EDS deliberately splits all page work into three phases — **Eager, Lazy, Delayed (E-L-D)** — orchestrated by `loadPage()` in `scripts.js`. The phase a piece of work lands in is the single biggest lever on your Core Web Vitals. Getting E-L-D right is most of "Keeping it 100."

- **Eager** — only what's needed for the **Largest Contentful Paint (LCP)**: decorate the DOM, load the *first* section, preload the LCP image. Everything here is on the critical path — keep it minimal.
- **Lazy** — the rest of the page: remaining sections' blocks, header, footer, `lazy-styles.css`. Runs after the page is interactive-enough.
- **Delayed** — anything safely deferrable: analytics/martech, chat widgets, A/B tooling. Loaded ~3s after load via `delayed.js`, and never blocks LCP.

## 2. Architecture

```js
// scripts.js (shape of the boilerplate)
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);                 // buttons, icons, autoblocks, sections, blocks
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'));   // FIRST section only
  }
  // optionally await fonts if they affect LCP
}

async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);             // remaining sections
  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  sampleRUM('lazy');
}

function loadDelayed() {
  window.setTimeout(() => import('./delayed.js'), 3000);
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}
```

**Timeline:**
```
0ms ───────────── LCP ───────────── interactive ─────── ~3s ──────►
│    EAGER        │       LAZY                    │   DELAYED
│ first section   │ rest + header/footer + lazy   │ martech, chat,
│ + LCP preload   │ styles                        │ experiments
```

## 3. Engineering rationale

**Why three phases and not "load everything"?** Because **LCP is the metric that matters most** for perceived speed and SEO. By constraining the eager phase to the first section and the LCP image, the browser paints meaningful content almost immediately. Deferring the rest keeps the main thread free and the critical request chain short.

**Why is martech in delayed?** Analytics, tag managers, and chat widgets are large, third-party, and *not* needed to read the page. Loading them eagerly is the classic way sites destroy their Lighthouse score. Delaying them ~3s protects LCP/INP while still capturing the session.

**Why load only the first section eagerly rather than the first block?** Sections are the natural LCP boundary; the LCP element is virtually always within the first section. Loading the whole first section (a few blocks) is a good approximation that avoids fragile "which block is the LCP" logic.

**The core trade-off:** a tiny risk that below-the-fold content isn't ready the instant a user scrolls, in exchange for a dramatically faster first paint. On content sites this is almost always correct; interactive-heavy widgets that must be instant can be nudged into the eager phase deliberately (rarely).

## 4. Examples

**Correct phase placement:**
```js
// EAGER — LCP image preload inside the hero block's decorate()
const link = document.createElement('link');
link.rel = 'preload';
link.as = 'image';
link.href = lcpSrc;
link.media = '(min-width: 900px)';        // media-scoped for art direction
document.head.appendChild(link);

// DELAYED — delayed.js
export default function loadDelayed() {
  import('./analytics.js');
  loadChatWidget();
}
```

**Wrong (analytics in eager) vs right (analytics in delayed):**
```js
// ❌ eager: blocks LCP with a 200KB third-party script
import('https://cdn.martech.example/tag.js');
// ✅ delayed.js: runs ~3s later, off the critical path
```

## 5. Hands-on exercises

1. **Classify the work.** Assign each to E, L, or D: hero LCP image, cookie-consent banner, footer navigation, Google Analytics, the third content section, a live-chat widget, `lazy-styles.css`.
2. **Trace `loadPage`.** Write the call order of `loadEager`/`loadLazy`/`loadDelayed` and one critical action inside each.
3. **LCP preload.** Add a media-scoped `<link rel=preload>` for a responsive LCP image inside a hero block and explain the `media` attribute's role.
4. **Regression hunt.** Given a page scoring 78 on PSI with analytics loaded in `scripts.js`, describe the one-line fix and expected effect.

## 6. Common mistakes

- **Analytics/chat/experiment scripts in eager or lazy** instead of delayed — the #1 score killer.
- **Loading all sections eagerly** "to avoid flicker," destroying LCP.
- **Heavy synchronous work** (large JSON parse, layout thrash) in `decorate` on the eager path.
- **Preloading the wrong image** or not preloading the LCP image at all.
- **Awaiting non-critical fonts** in the eager phase.

## 7. Review questions

1. Name the three phases and one representative task in each.
2. Why is the LCP the organizing principle of the eager phase?
3. Why does martech belong in the delayed phase, and roughly when does it fire?
4. Why load the first *section* eagerly rather than trying to find the LCP block?
5. What's the trade-off you accept by deferring below-the-fold work?

## 8. Best practices

- **Keep eager minimal**: decorate + first section + LCP preload.
- **Put all third-party/martech in `delayed.js`.**
- **Preload the LCP image** (media-scoped for art-directed responsive images).
- **Measure with PSI** on the preview URL before and after phase changes.
- **`fetchpriority="high"`/`loading="eager"` only on the LCP image**; everything else `loading="lazy"`.

## 9. Anti-patterns

- **"Load it all upfront"** thinking imported from SPA/server rendering.
- **Third-party tags in the critical path.**
- **Blocking the eager phase on network** (fragments, JSON) for non-LCP content.
- **Moving work into eager to "fix" a scroll flicker** rather than optimizing the lazy load.

---

**Next:** [Lesson 08 — Universal Editor & Component Models →](lesson-08-universal-editor.md)
