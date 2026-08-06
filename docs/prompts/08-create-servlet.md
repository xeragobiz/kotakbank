# 08 · Create Servlet 🟡

> **Guardrail — this repo has NO Sling Servlets (no Java, no server tier).** In this repo the equivalent is fetching a published `.json` / `query-index.json`, or calling an external API from client-side JS. Use the traditional path only on a real AEMaaCS project.

## Variables
- `{{ENDPOINT_PURPOSE}}` — what it returns/does, e.g. "return branch rates as JSON", "accept a lead form POST"
- `{{METHOD}}` — GET / POST
- `{{DATA_SHAPE}}` — request/response shape
- `{{STACK}}` — `eds` or `aemaacs`

## Prompt
```
I want a servlet-style endpoint for: {{ENDPOINT_PURPOSE}} ({{METHOD}}), data shape: {{DATA_SHAPE}}.

FIRST detect the stack (or use STACK={{STACK}}):
- If Edge Delivery Services (THIS repo): do NOT write a Java servlet (docs/skills/10-servlets.md).
  * For GET/read data: source it from a published .json spreadsheet or query-index.json and fetch() it in the block;
    build/render DOM client-side (sanitize any HTML with dompurify). Add needed fields to helix-query.yaml if using the index.
  * For POST/submit: post to the designated EXTERNAL API from JS. Never embed secrets in client code.
    Ensure the origin is allowed by the CSP connect-src in head.html. Do network work off the eager/LCP path; handle failures gracefully.
- Only if traditional AEMaaCS: create a Sling Servlet (@SlingServletPaths or resourceType + methods/extensions),
  proper doGet/doPost, input validation, and JSON response handling.

State the detected stack first.
```

## Validation (EDS path)
- [ ] No Java servlet; data via published JSON / query index; submit to external API.
- [ ] No secrets in client code; CSP connect-src respected; off eager path; failures handled.
