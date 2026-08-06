# 13 · Edge Delivery Services (runtime, config, publish)

## Purpose
Understand the EDS runtime and the config surfaces that control it: how content is mounted and delivered, the three-phase page load, and how a change reaches preview/live. This is the platform every other skill sits on.

## When to use
- Onboarding to the project's runtime model.
- Changing a config file (`fstab.yaml`, `helix-query.yaml`, `helix-sitemap.yaml`, `head.html`, `.hlxignore`).
- Understanding the eager/lazy/delayed split, or how publishing works.

## Best practices
- **Content mount:** `fstab.yaml` mounts the AEMaaCS author content source; don't repoint it casually.
- **Three-phase loading** (`scripts.js` → `loadPage`): *eager* does only LCP essentials (decorate sections/blocks/buttons, load first section); *lazy* loads the rest + header/footer + `lazy-styles.css`; *delayed* runs martech/deferrable work (`delayed.js`). Don't move lazy/delayed work into eager.
- **Inspect delivered markup** before coding: `curl http://localhost:3000/path`, `.../path.plain.html`, `.../path.md`.
- **`head.html`** owns the strict CSP and eager loads of `aem.js`, `scripts.js`, `styles.css`; inline scripts need `nonce="aem"`.
- **`helix-query.yaml`** defines `query-index.json`; **`helix-sitemap.yaml`** the sitemap; **`.hlxignore`** what's not served.
- **Publishing** = push to branch → AEM Code Sync → preview (`{branch}--kotakbank--xeragobiz.aem.page`) / live (`main--…aem.live`). No manual deploy.
- **Never modify `scripts/aem.js`.**

## Anti-patterns
- ❌ Doing non-critical work in the eager phase (hurts LCP).
- ❌ Assuming block DOM instead of inspecting `…plain.html`.
- ❌ Relaxing the CSP or adding inline scripts without `nonce="aem"`.
- ❌ Repointing `fstab.yaml` or editing `scripts/aem.js`.
- ❌ Expecting a manual deploy step — publish is push-driven.

## Examples
```bash
curl http://localhost:3000/index.plain.html   # delivered markup for a block
```
```yaml
# fstab.yaml — content mount (do not casually change)
mountpoints:
  /: https://author-p165370-e1760075.adobeaemcloud.com/...
```
```
Environments:
  preview: https://{branch}--kotakbank--xeragobiz.aem.page/
  live:    https://main--kotakbank--xeragobiz.aem.live/
```

## Validation checklist
- [ ] Work correctly placed in eager/lazy/delayed; eager stays lean.
- [ ] Delivered markup inspected before coding.
- [ ] Config changes confined to the intended YAML/HTML file; `fstab.yaml` mount unchanged unless intended.
- [ ] CSP respected in `head.html`; inline scripts carry `nonce="aem"`.
- [ ] `scripts/aem.js` untouched.
- [ ] Change verified on the branch preview URL after push.
