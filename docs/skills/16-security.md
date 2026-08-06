# 16 · Security

## Purpose
Keep the client-side codebase safe: no committed secrets, strict CSP compliance, sanitized HTML injection, and safe handling of credentials. Everything in this repo is public, served client-side code.

## When to use
- Injecting authored/remote HTML into the DOM.
- Adding inline scripts, external origins, or new dependencies.
- Any time credentials/tokens come up.

## Best practices
- **Never commit secrets** (API keys, tokens, passwords) — the repo is public.
- **Never accept, store, echo, or use credentials pasted into chat** (GitHub PATs, IMS/DA Bearer tokens, API keys). Git push, `admin.hlx.page`, and Document Authoring uploads have credentials injected automatically when the matching Settings opt-in is enabled — no in-band token is ever needed. On 401/403, tell the user to enable the opt-in in Settings → LLM Permissions; don't ask for a token.
- **Sanitize any HTML** from authored/remote sources before `innerHTML` — use `scripts/dompurify.min.js`.
- **Respect the CSP** in `head.html` (`script-src 'nonce-aem' 'strict-dynamic' …`): inline scripts need `nonce="aem"`; avoid `eval` and inline event handlers; prefer external ES modules; external fetch origins must be allowed by `connect-src`.
- **Sentry** (`scripts/sentry.js`) does error monitoring — never log PII/secrets into it.
- Vet new third-party JS for size and provenance (Renovate keeps deps patched); follow WCAG 2.1 AA and Adobe security guidance.

## Anti-patterns
- ❌ Committing a `.env`, key, or token; echoing a pasted secret back.
- ❌ `element.innerHTML = untrustedString` without DOMPurify.
- ❌ Inline scripts without `nonce="aem"`, inline `onclick=`, or `eval`.
- ❌ Calling an origin not permitted by the CSP; embedding an API key in client JS.
- ❌ Logging user PII/secrets into Sentry.

## Examples
```js
import DOMPurify from '../../scripts/dompurify.min.js';
el.innerHTML = DOMPurify.sanitize(remoteHtml); // always sanitize
```
```html
<!-- head.html: inline script must carry the nonce -->
<script nonce="aem">/* ... */</script>
```

## Validation checklist
- [ ] No secrets committed; no pasted credential used or echoed.
- [ ] Authored/remote HTML sanitized with DOMPurify before injection.
- [ ] CSP respected: no un-nonced inline scripts, no `eval`/inline handlers; external origins allowed by `connect-src`.
- [ ] No PII/secrets sent to Sentry.
- [ ] New dependencies vetted for size/provenance.
