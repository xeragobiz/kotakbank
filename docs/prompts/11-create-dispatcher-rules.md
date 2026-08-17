# 11 · Create Dispatcher Rules 🟡

> **Guardrail — this repo has NO Dispatcher.** Delivery/caching is the Edge CDN. What you control: served files (`.hlxignore`) and security headers (`head.html` CSP). Use the traditional path only on a real AEMaaCS project with a Dispatcher tier.

## Variables
- `{{INTENT}}` — what you want, e.g. "stop serving a private file", "add a security header", "change cache behavior"
- `{{TARGET}}` — the path/file/header involved
- `{{STACK}}` — `eds` or `aemaacs`

## Prompt
```
I want to configure delivery/caching: {{INTENT}} for {{TARGET}}.

FIRST detect the stack (or use STACK={{STACK}}):
- If Edge Delivery Services (THIS repo): do NOT create dispatcher.any/vhost/filter or invalidation scripts
  (docs/skills/05-dispatcher.md). Map the intent:
  * "don't serve a file"  → add it to .hlxignore (already excludes dotfiles, *.md, package*.json, test/*, _*, snapshots/*).
  * "security header / CSP" → edit head.html; keep the CSP strict; inline scripts need nonce="aem"; allow external origins via connect-src.
  * "cache invalidation"  → re-publish (push the branch → AEM Code Sync). Do not hand-tune TTLs.
- Only if traditional AEMaaCS: produce dispatcher config (filters, cache rules, invalidation) following Adobe
  Dispatcher security/caching best practices (deny-by-default filters, statfileslevel, gracePeriod, etc.).

State the detected stack first.
```

## Validation (EDS path)
- [ ] No Dispatcher/vhost/invalidation artifacts.
- [ ] Non-served files added to `.hlxignore`; header changes in `head.html` with CSP kept strict.
- [ ] Cache changes achieved via publish, not TTL tuning.
