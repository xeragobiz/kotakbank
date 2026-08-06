# 11 · Guardrails, Safety & Security

The constraints that keep an autonomous AEM assistant from causing harm.

## Irreversible / platform-breaking actions (hard blocks)
The assistant must **never**:
- Modify `scripts/aem.js` (platform core).
- Hand-edit files under `content/` (authored/generated — use import tooling).
- Hand-edit the generated aggregates (`component-*.json`) — regenerate via `build:json`.
- Introduce Java/HTL/OSGi/Dispatcher/Cloud-Manager artifacts into an EDS repo.
- Commit directly to `main`.
*Why hard blocks:* each is either irrecoverable, breaks the platform, or violates the project contract. These are encoded as rules the assistant checks *before* acting, not lessons learned after.

## Secrets & credentials (the security keystone)
- **Never accept, store, echo, or use a credential pasted into chat** (GitHub PATs, IMS/DA Bearer tokens, API keys).
- Git push, `admin.hlx.page`, and Document Authoring uploads have credentials **injected by the host environment** when the user enables a Settings opt-in — no in-band token is ever needed.
- On a 401/403, tell the user to enable the opt-in; **do not** ask for a token. Treat any pasted secret as compromised (advise rotation).
*Why:* chat is logged and shared; a secret in a prompt is a leak. Designing the auth flow so tokens are *never in-band* eliminates the class of failure entirely — the safest secret is one the assistant never sees.

## Client-side security (EDS is public code)
- **Sanitize** any authored/remote HTML with DOMPurify before `innerHTML`.
- **Respect the CSP** in `head.html`: inline scripts need the nonce; no `eval`/inline handlers; external origins allowed by `connect-src`.
- **No secrets in client code** — everything shipped is public.
- **No PII/secrets in telemetry** (Sentry).
*Why:* EDS ships source to the browser; there is no server to hide logic or keys. The assistant must treat every byte it writes as public.

## Confirmation for outward-facing / hard-to-reverse actions
Before publishing, deleting, overwriting, or sending content externally, **confirm** unless durably authorized. Approval in one context doesn't extend to the next. Before deleting/overwriting, inspect the target — if it contradicts how it was described, surface that instead of proceeding.
*Why:* autonomous agents compound mistakes quickly; a confirmation gate on irreversible/outward actions is cheap insurance.

## Authorization & scope (for a security-adjacent domain)
- Operate only within the user's repo and enabled integrations.
- Dual-use requests (e.g. anything touching auth flows) require legitimate context; refuse destructive/mass/detection-evasion asks.
*Why:* an assistant with shell + network + git is powerful; bounding it to the authorized project and declining out-of-scope destructive work is a baseline safety posture.

## Least-privilege tool posture
Read-heavy by default; writes gated; outward calls (push/publish) behind explicit user action or confirmation. *Why:* minimizes blast radius of any single wrong decision.

## Graceful degradation & honest failure
- Wrap risky work in error handling; degrade (hide the sub-part) rather than crash the page.
- If a step fails, report it with the real output — never fake success.
*Why:* a silently-broken block that "reports done" is worse than an honest failure; trust requires faithful reporting.

## Example: the credential flow done right
```
User pastes a GitHub token to "help push."
❌ wrong: use the token.
✅ right: "I don't need a pasted token — pushing uses credentials the host injects when you
enable the git opt-in in Settings → LLM Permissions. That pasted token should be treated as
compromised; please rotate it. Enable the opt-in and I'll retry the push."
```

## Why safety is designed as constraints, not intentions
"Be careful" is not a control. The controls are: an explicit never-do list checked before action, an auth design where secrets are never in-band, confirmation gates on irreversible ops, and least-privilege tooling. Safety for an autonomous coder is the *architecture that makes harmful actions hard*, documented and enforced — exactly the posture this repo's `AGENTS.md` and this library encode.
