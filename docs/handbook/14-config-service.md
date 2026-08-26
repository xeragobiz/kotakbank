# 14 · Configuration Service (query, sitemap, fstab, robots)

How this project manages **content/config settings** — query indexing, sitemaps, content source, robots, sidekick — through the **AEM Configuration Service** instead of repo YAML files. This is the *repoless* model: config lives in the service, not in Git.

> **Grounding.** As of 2026-08-26 both sites — `kotakbank` (prod) and `kotakbank-dev` — read query/sitemap/content-source config from the Configuration Service. The repo's `fstab.yaml`, `helix-query.yaml`, and `helix-sitemap.yaml` were **removed** because the service overrides them. See [07](07-preview-publish-delivery.md) (preview/publish), [12](12-environments-and-promotion.md) (branch=environment). Reference: https://www.aem.live/docs/config-service-setup

---

## The one idea: config service overrides the repo

Per aem.live: *"Once you have enabled the configuration service, the configuration settings there override the settings you have in configuration files in your GitHub repository."*

So a config file committed in the repo is **silently ignored** once the service holds the same config. To avoid a confusing split-brain, the guidance is to **remove** the repo files and manage config only in the service.

- **Recommendation:** manage query/sitemap/fstab/robots config **only** in the Configuration Service; do **not** keep the equivalent repo YAML files.
  **Why:** two sources of truth is a trap — you edit `helix-sitemap.yaml` in the repo, push, and nothing changes on the site because the service wins. Removing the repo file makes the service unambiguously the source of truth.
- **Recommendation:** YAML is still the format — it just lives in the service now.
  **Why:** the service stores config as YAML at `content/query.yaml`, `content/sitemap.yaml`, etc. You author the same YAML you always did; only the *location* moved (Git repo → config service).

---

## What the config service manages vs. what stays in Git

| Managed by the **config service** (not in repo) | Stays in **Git** (normal code) |
|---|---|
| Content source (was `fstab.yaml`) | `blocks/**` (JS/CSS/JSON models) |
| Query index (was `helix-query.yaml`) | `scripts/**`, `styles/**` |
| Sitemap (was `helix-sitemap.yaml`) | `head.html`, `models/**` |
| `robots.txt` | `icons/`, `fonts/` |
| Sidekick config (`tools/sidekick/config.json`) | `.github/workflows/**` |

- **Recommendation:** the "no config file in repo" rule applies **only** to the config surface above — not to all `.yaml`/`.json`.
  **Why:** component models (`_{block}.json`), `head.html`, and workflows are code, delivered by Code Sync, and must stay in Git. Only the *content/config* files migrate to the service.

---

## Site topology (repoless: one codebase, many sites)

One GitHub codebase (`xeragobiz/kotakbank`) serves multiple sites; each site independently binds its **content source** and **code source** in the service.

| Site | Content source (config service) | Code | Served host |
|---|---|---|---|
| `kotakbank` (prod) | `author-p165370-e1760075…/kotakbank/…` (markup) | `github.com/xeragobiz/kotakbank` | `main--kotakbank--xeragobiz` |
| `kotakbank-dev` | `author-p165370-e1760075…/kotakbank-dev/dev` (markup) | same repo | `main--kotakbank-dev--xeragobiz` |

- **Recommendation:** remember **code ref and content ref can differ.** `kotakbank-dev` serves code from `main` but binds content at the `dev` ref.
  **Why:** pushing code to the repo `dev` branch does **not** deploy `kotakbank-dev` — it serves code from `main`. This tripped up a deployment during setup. See [[project-dev-main-divergence]].

---

## How to read and edit config

Config lives under `https://admin.hlx.page/config/{org}/sites/{site}/content/{name}.yaml`.

**Read (GET):**
```bash
curl "https://admin.hlx.page/config/xeragobiz/sites/kotakbank/content/sitemap.yaml"
curl "https://admin.hlx.page/config/xeragobiz/sites/kotakbank/content/query.yaml"
```

**Update (POST — not PUT):**
```bash
curl -X POST "https://admin.hlx.page/config/xeragobiz/sites/{site}/content/sitemap.yaml" \
  -H "content-type: text/yaml" \
  --data-binary @sitemap.yaml
# 204 = success
```

- **Recommendation:** use **POST** with `content-type: text/yaml`. Do **not** use PUT.
  **Why:** PUT returns **409 Conflict** on these endpoints; POST is the documented create/update method. (Learned the hard way during the prod origin fix.)
- **Recommendation:** always **GET first**, edit the full document, then POST the whole thing back.
  **Why:** POST replaces the entire file — there is no partial patch. Start from the current content so you don't drop keys.
- **Recommendation:** credentials are **injected automatically** when the Settings opt-in is enabled — never paste a token.
  **Why:** a 401/403 means the opt-in is off (fix in Settings), not that you need a token in-band.
- **Recommendation:** the UI at **`tools.aem.live`** is the same config service; use it or the API interchangeably.
  **Why:** both write the same `content/*.yaml`. Pick whichever the operator prefers; they don't conflict.

---

## After editing: regenerate (config changes don't auto-apply)

- **Recommendation:** after a **query** config change, trigger a **Reindex** so existing pages re-scan against the new rules.
  **Why:** publishing a page auto-indexes it, but a *config* change does not retroactively re-scan already-published pages.
- **Recommendation:** after a **sitemap** config change, force a rebuild — the XML does **not** auto-refresh on config change.
  **Why:** verified during setup — a `lastmod`/`origin` edit only took effect after an explicit regenerate:
  ```bash
  curl -X POST "https://admin.hlx.page/sitemap/xeragobiz/{site}/main/sitemap-en.xml"
  ```
  (A normal page *publish* does rebuild the child sitemaps automatically; it's the *config* change that needs the manual nudge.)

---

## The multilingual (en/hi) config, for reference

Both sites carry this exact config in the service.

**`content/query.yaml`** — one index per language, each excluding fragments/utility pages, each carrying the mandatory `robots` property:
```yaml
version: 1
indices:
  en:
    include: ['/en/**']
    exclude: ['/**.json', '/en/nav', '/en/footer', '/en/fragments/**',
              '/en/search', '/en/apply', '/en/track-application', '/en/compareapi-integration']
    target: /en/query-index.json
    properties:
      title:        { select: 'head > meta[property="og:title"]',   value: 'attribute(el, "content")' }
      description:  { select: 'head > meta[name="description"]',      value: 'attribute(el, "content")' }
      image:        { select: 'head > meta[property="og:image"]',     value: 'attribute(el, "content")' }
      lastModified: { select: none, value: 'parseTimestamp(headers["last-modified"], "ddd, DD MMM YYYY hh:mm:ss GMT")' }
      robots:       { select: 'head > meta[name="robots"]',           value: 'attribute(el, "content")' }
  hi:
    include: ['/hi/**']
    exclude: ['/**.json', '/hi/nav', '/hi/footer', '/hi/fragments/**',
              '/hi/search', '/hi/apply', '/hi/track-application', '/hi/compareapi-integration']
    target: /hi/query-index.json
    properties: { …same 5 properties… }
```

**`content/sitemap.yaml`** — per-language sitemaps with hreflang + alternate, an origin, and an index:
```yaml
sitemaps:
  kotak:
    origin: https://main--kotakbank--xeragobiz.aem.live
    lastmod: YYYY-MM-DD          # DATE FORMAT string, NOT a property name
    default: en
    languages:
      en: { source: /en/query-index.json, destination: /sitemap-en.xml, hreflang: en, alternate: /en/{path} }
      hi: { source: /hi/query-index.json, destination: /sitemap-hi.xml, hreflang: hi, alternate: /hi/{path} }
index:
  - /sitemap-en.xml
  - /sitemap-hi.xml
```

- **Recommendation:** `lastmod` must be a **date format** (`YYYY-MM-DD`), never a property name.
  **Why:** putting `lastModified` there produced garbage output like `lam46t8o2ifie2` — the formatter treats each character as a date token.
- **Recommendation:** always set `origin` (with protocol).
  **Why:** with no `cdn.prod.host` configured, a missing `origin` renders every `<loc>` as `https://undefined/...`, making the sitemap unusable.
- **Recommendation:** every query index **must** include the `robots` property.
  **Why:** it's what lets `robots: noindex` pages be dropped from the sitemap; the manual-sitemap docs require it.

---

## Known gotchas (from this project)

- **`/sitemap-index.xml` does not generate** despite a correct top-level `index:` block. Config is right (matches the aem.live canonical example); the platform isn't materializing that path on this repoless setup. **Workaround:** submit the child sitemaps (`/sitemap-en.xml`, `/sitemap-hi.xml`) directly to Search Console — an index file is a convenience, not a requirement. Raise with Adobe support to resolve.
- **A stale default `/sitemap.xml`** (Method-1 auto sitemap) may linger listing root pages; the manual config's index takes precedence, but the leftover is worth cleaning up with Adobe.
- **Split-brain risk:** if someone re-adds `helix-query.yaml`/`helix-sitemap.yaml` to the repo, it will be **silently ignored** (service wins) and mislead readers. Don't re-add them.

---

### Quick reference

```bash
# read
curl "https://admin.hlx.page/config/xeragobiz/sites/{site}/content/sitemap.yaml"
# update (POST, text/yaml, whole file)
curl -X POST "https://admin.hlx.page/config/xeragobiz/sites/{site}/content/query.yaml" \
  -H "content-type: text/yaml" --data-binary @query.yaml
# regenerate sitemap after a config change
curl -X POST "https://admin.hlx.page/sitemap/xeragobiz/{site}/main/sitemap-en.xml"
```
`{site}` = `kotakbank` (prod) or `kotakbank-dev`. UI equivalent: **tools.aem.live**.
