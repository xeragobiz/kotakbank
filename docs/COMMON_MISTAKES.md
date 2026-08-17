# Common Mistakes

The anti-playbook. Each entry: the mistake → why it's wrong → the fix. Ordered by how badly it breaks things.

## Catastrophic (breaks the platform, build, or content)
| ❌ Mistake | Why it's wrong | ✅ Fix |
|---|---|---|
| Editing `scripts/aem.js` | It's the platform core; changes break decoration and are overwritten | Put shared logic in a `scripts/` module; never touch `aem.js` |
| Hand-editing files under `content/` | Authored content is backend/import-produced; edits are lost and can corrupt authoring | Use `tools/importer/` bundles |
| Hand-editing `component-*.json` aggregates | They're generated; CI's `git diff --exit-code` JSON-sync gate fails | Edit `_*.json`, run `npm run build:json`, commit the result |
| Introducing Java/Maven/HTL/OSGi/Dispatcher/Cloud-Manager | None exist here; violates `AGENTS.md`; wrong repo | Map to the EDS equivalent (see `docs/skills/`) |
| Committing to `main` | Bypasses review/preview gates | Feature branch + PR with preview link |

## High (breaks the block or a page)
| ❌ Mistake | Why it's wrong | ✅ Fix |
|---|---|---|
| Reading cells by fixed index (`cells[2]`) | Universal Editor field-collapsing varies cell counts | Classify cells by content (image/copy/CTA) |
| Non-idempotent decoration | UE re-decorates; a second pass corrupts the DOM | Guard against re-running; make transforms idempotent |
| Throwing on a missing/optional cell | Authors omit optionals; the block crashes | Null-check; degrade gracefully |
| Forking a shared block for one page | Diverges 50-block consistency; risks other pages | Add a variant/model option, or a dedicated `k811-*` block |
| Changing a shared block without regression-testing | `hero`/`cards`/`columns` are used across pages | Smoke-test dependent pages; additive changes only |

## Medium (quality / standards)
| ❌ Mistake | Why it's wrong | ✅ Fix |
|---|---|---|
| Bare / `-container` / `-wrapper` CSS selectors | Leaks styles page-wide; those are section classes | Scope every selector to `.{block}` |
| Desktop-first CSS | Violates mobile-first standard | Base styles + `min-width` 600/900/1200 |
| Missing `.js` in imports; CRLF endings | ESLint `import/extensions` + `linebreak-style` fail | Add `.js`; use Unix LF |
| Forgetting `npm run build:json` after a model change | CI JSON-sync gate fails | Run it; commit aggregates |
| Animating layout properties (width/top/left) | Causes jank + CLS | Animate transform/opacity only + `prefers-reduced-motion` |
| Adding a heavy dependency | Every KB ships to the browser | Prefer the ~2KB shared IntersectionObserver |

## Performance / LCP
| ❌ Mistake | Why it's wrong | ✅ Fix |
|---|---|---|
| Eager-loading non-LCP images / lazy-loading the LCP image | Wrecks LCP | LCP image eager+preload (k811-hero pattern); rest `loading="lazy"` |
| Non-critical work in the eager phase | Blocks LCP | Move to lazy/`delayed.js` |
| Non-critical CSS in `styles.css` | Bloats the eager path | Put it in `lazy-styles.css` |

## Security
| ❌ Mistake | Why it's wrong | ✅ Fix |
|---|---|---|
| `innerHTML = authoredString` unsanitized | XSS + CSP violation | Sanitize with `scripts/dompurify.min.js` |
| Inline script without `nonce="aem"`; `eval`/inline handlers | Blocked by the strict CSP | External ES modules; add the nonce |
| Committing/echoing a secret or pasted token | Repo is public; token compromised | Never; use the Settings opt-in for git/DA auth |
| Logging PII/secrets to Sentry | Privacy/security leak | Log neither |

## Process
| ❌ Mistake | Why it's wrong | ✅ Fix |
|---|---|---|
| PR without a `…aem.page/{path}` preview link | Rejected per `AGENTS.md` | Always include it |
| Skipping `npm run lint` locally | CI fails later; wastes a cycle | Run lint (and `lint:fix`) before commit |
| Defaulting to Playwright `screenshot` for routine checks | Token-expensive | Use `snapshot`/`evaluate`; screenshot only for pixel QA |

## Why this list exists
An AEM-trained LLM's default instincts (Java components, Dispatcher rules, hand-editing content, reading fixed positions) are almost all wrong here. Cataloguing them with the *reason* and the *fix* lets the assistant self-correct instead of confidently producing plausible-but-wrong AEMaaCS solutions — the single most likely failure mode on this repo. Ordering by blast radius means the assistant internalizes the platform-breaking ones first.
