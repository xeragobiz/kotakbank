# 05 · Dispatcher → Edge CDN + `.hlxignore` (mapping skill)

> **This repo has no Dispatcher.** There is no Apache/`dispatcher.any`, no vhost, no `filter`/`cache` rules, no invalidation scripts. Caching and delivery are handled by the Edge Delivery CDN.

## Purpose
Explain how caching, delivery control, and security headers are handled without a Dispatcher tier. What you *can* control: which files are served (`.hlxignore`), security headers (`head.html` CSP), and cache lifecycle (via preview/publish).

## When to use
- When asked to "configure the Dispatcher / cache rules / invalidation" → use the mappings below.
- When you need to stop a file being served, or set a security header.

## Mapping
| Dispatcher concern | EDS equivalent |
|---|---|
| `/filter` allow/deny rules | `.hlxignore` (files the platform must NOT serve) |
| Cache headers / TTL | Managed by the Edge CDN; refreshed on preview/publish |
| Cache invalidation (flush) | Publish (push → AEM Code Sync → preview/live) |
| Security headers / vhost | `head.html` (strict CSP) + platform config |
| Response filtering | `.hlxignore` + not exposing internal files |

## Best practices
- Add build-only/private/non-served files to `.hlxignore` (it already excludes dotfiles, `*.md`, `package*.json`, `test/*`, `_*` partials, `snapshots/*`).
- Control security headers via `head.html`'s CSP (`script-src 'nonce-aem' 'strict-dynamic' …`); inline scripts need `nonce="aem"`.
- Trust the platform for caching; don't try to hand-tune TTLs. To "invalidate", re-publish.
- Keep the eager asset path lean so cached responses are LCP-friendly (see [14](14-performance.md)).

## Anti-patterns
- ❌ Adding a `dispatcher/` directory, `dispatcher.any`, or vhost config.
- ❌ Writing cache-invalidation shell scripts.
- ❌ Relaxing the CSP in `head.html` to make something "work" without justification.
- ❌ Committing files that shouldn't be public without adding them to `.hlxignore`.

## Examples
```
# .hlxignore — the "filter" of this project (do NOT serve these)
.*
*.md
karma.config.js
LICENSE
package.json
package-lock.json
test/*
_*
snapshots/*
```

## Validation checklist
- [ ] No Dispatcher/Apache/vhost artifacts introduced.
- [ ] Any new private/build-only file added to `.hlxignore`.
- [ ] Security header changes made in `head.html`; CSP still strict; inline scripts carry `nonce="aem"`.
- [ ] Cache changes achieved via publish, not manual TTL tuning.
