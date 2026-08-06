# 07 · Preview, Publish & Delivery

## The delivery model
Code: git push → **AEM Code Sync** → preview/live. Content: authored → delivered via the `fstab.yaml` mount → edge. Both meet at `*.aem.page` (preview) and `*.aem.live` (live).

- **Recommendation:** treat "publish" as "push the branch" for code, and the authoring publish action for content.
  **Why:** there is no manual deploy step. Understanding that code and content publish independently prevents the confusion of "I pushed but the content didn't change" (and vice-versa).

## Preview
- **Recommendation:** verify every change on the branch preview (`https://{branch}--{repo}--{org}.aem.page/{path}`) before opening a PR; locally use `aem-cli up` at `:3000` with Playwright `snapshot`/`evaluate`.
  **Why:** localhost approximates delivery but the preview reflects the real edge pipeline (optimized images, CSP, caching). PSI must run against the preview, not localhost, to be meaningful. Snapshot/evaluate are cheap; reserve screenshots for pixel QA.
- **Recommendation:** inspect delivered markup with `curl .../{path}.plain.html` before coding a block.
  **Why:** `.plain.html` is the exact backend-emitted DOM your `decorate()` will receive — the ground truth that prevents index-based/assumed-structure bugs.

## Publish
- **Recommendation:** work on a feature branch; open a PR to `main` with a mandatory preview-URL link; ship only when CI (`gh pr checks`: lint + JSON-sync) is green and Code Sync has published.
  **Why:** the preview link lets a reviewer verify the actual rendered result — a diff alone can't show a rendering regression. The CI gates catch style errors and stale aggregates before they reach `main`.
- **Recommendation:** never commit directly to `main`.
  **Why:** `main` publishes to production; unreviewed changes go live without the preview/CI gate.

## Delivery & caching (cross-reference)
- **Recommendation:** rely on the Edge CDN; re-publish to invalidate; control served files via `.hlxignore` and headers via `head.html`. (Full detail in [04](04-loading-and-performance.md).)
  **Why:** no Dispatcher/TTL to manage; the platform handles edge caching, refreshed on publish.

## Preview/publish for content (admin APIs)
- **Recommendation:** trigger content preview/publish via the platform's admin action / `admin.hlx.page`; credentials are injected by the host when the Settings opt-in is enabled — never handle tokens in-band.
  **Why:** security ([09](09-antipatterns-mistakes-validation.md)); a pasted token is a leak, and the injected-credential path means one is never needed.

## Validation checklist — preview/publish
- [ ] Delivered markup inspected (`.plain.html`) before coding.
- [ ] Change verified on the branch preview at 3 widths; PSI run on preview.
- [ ] Feature branch; `gh pr checks` green; Code Sync published; PR has the preview link.
- [ ] No direct commits to `main`; no in-band credentials.
