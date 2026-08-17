# 04 · Client Libraries → per-block CSS/JS + `styles/` (mapping skill)

> **This repo has no clientlibs.** There is no `cq:ClientLibraryFolder`, no `categories`, no `dependencies`, no `clientlib-*` build. CSS/JS are plain files served as-is and code-split per block by the platform.

## Purpose
Explain how CSS/JS are organized and loaded in EDS. Instead of clientlib categories, the platform automatically loads a block's `{name}.css` and `{name}.js` when that block appears on a page, plus a small set of global stylesheets.

## When to use
- When asked to "create a clientlib" or "add a category" → add block CSS/JS or edit the global `styles/` files.
- When deciding where a style/script belongs (global vs block vs lazy).

## Mapping
| Clientlib concept | EDS equivalent |
|---|---|
| `cq:ClientLibraryFolder` + `categories` | `blocks/{name}/{name}.css` + `{name}.js` (auto code-split per block) |
| Global base clientlib | `styles/styles.css` (global + LCP-critical, loaded eager) |
| Deferred clientlib | `styles/lazy-styles.css` (below-the-fold, lazy) |
| `@font-face` clientlib | `styles/fonts.css` + `fonts/` |
| Dependency graph / embeds | Explicit ES module `import` with `.js` extensions |
| Scoped theme clientlib | `styles/kotak811.css` (applied only under `main.kotak811`) |

## Best practices
- Keep `styles/styles.css` limited to **global + LCP-critical** rules; push the rest to `styles/lazy-styles.css`.
- Block styles go in `blocks/{name}/{name}.css`, **scoped to `.{name}`**; the platform code-splits them.
- k811-* design tokens live in `styles/kotak811.css`; blocks inherit them via `initK811`.
- Import shared JS as ES modules with explicit `.js` extensions; no bundler, no dependency manifest.
- Minimise new runtime dependencies — every KB ships to the browser.

## Anti-patterns
- ❌ Creating a `clientlibs/` folder, `.content.xml`, or category metadata.
- ❌ Dumping block-specific CSS into `styles.css` (bloats the eager path, hurts LCP).
- ❌ Global/bare selectors in block CSS instead of `.{name}` scoping.
- ❌ Adding a bundler/minifier build step; code ships as authored.

## Examples
```
styles/styles.css        → global + LCP-critical (eager)
styles/lazy-styles.css   → below-the-fold (lazy)
styles/fonts.css         → @font-face
styles/kotak811.css      → scoped design guide (main.kotak811)
blocks/hero/hero.css     → auto-loaded only on pages using the hero block
```

## Validation checklist
- [ ] No `clientlibs/` / `.content.xml` / category artifacts.
- [ ] Global path (`styles.css`) holds only global + LCP-critical rules; rest in `lazy-styles.css`.
- [ ] Block CSS lives with the block and is scoped to `.{name}`.
- [ ] JS imports use explicit `.js` extensions; no new heavy dependency.
- [ ] `npm run lint` (CSS + JS) passes.
