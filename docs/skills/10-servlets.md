# 10 · Sling Servlets → static JSON / external APIs (mapping skill)

> **This repo has no Sling Servlets.** There is no `@SlingServletPaths`, no `doGet`/`doPost`, no server-side endpoints you deploy. There is no application server in this project.

## Purpose
Explain how dynamic/back-end behavior is achieved in EDS. Instead of writing servlets, you fetch **published static resources** (`.json` spreadsheets, `query-index.json`) or call **external APIs** from client-side JS, and handle interactivity in the browser.

## When to use
- When asked to "write a servlet / server endpoint" → use the mappings below.
- When a block needs data or a form submission target.

## Mapping
| Servlet concept | EDS equivalent |
|---|---|
| `doGet` returning JSON | `fetch('/data.json')` (published spreadsheet) or `query-index.json` |
| `doPost` (form submit) | Post to an external API / forms service from JS |
| Servlet-computed view | Client-side `decorate()` building DOM |
| Request parameters | URL params / `location`, read in JS |
| Auth-protected endpoint | External service with its own auth; never embed secrets |

## Best practices
- Read data from published `.json` resources or the query index; compute/render in the block.
- For submissions, POST to the designated external endpoint from JS; validate input client-side.
- **Never embed secrets/keys** in client code — everything here is public (see [16](16-security.md)).
- Respect the CSP `connect-src` in `head.html` when calling external origins.
- Do network work off the eager path; degrade gracefully on failure.

## Anti-patterns
- ❌ Creating Java servlets / server endpoints in this repo.
- ❌ Putting API keys/tokens in client JS.
- ❌ Assuming a server can transform requests — all logic is client-side or external.
- ❌ Blocking LCP on a data fetch.

## Examples
```js
// "GET endpoint" = a published JSON resource
const data = await (await fetch('/config/rates.json')).json();

// "POST endpoint" = external service, no secrets in the client
await fetch('https://api.example.com/lead', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});
```

## Validation checklist
- [ ] No server-side servlet artifacts introduced.
- [ ] Data via published JSON / query index; submissions to an external service.
- [ ] No secrets in client code; external origins allowed by the CSP.
- [ ] Network work off the eager path; failures handled gracefully.
