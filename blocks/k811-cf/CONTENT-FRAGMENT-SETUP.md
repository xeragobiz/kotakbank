# K811 CF block — Content Fragment delivery setup

The `k811-cf` block renders an AEM Content Fragment as inlined HTML on the page.
It follows the **markup-pipeline** approach (json2html overlay), so Content
Fragment **images come from the DAM automatically** as optimized `./media`
references — no assets in git, and **no Dynamic Media required**.

## How it works

1. Author selects a Content Fragment in Universal Editor (the block's
   `reference` field, an `aem-content` picker).
2. The field yields the CF's **DAM path**, e.g.
   `/content/dam/kotakbank/cards-content-fragments/kotak-air-card`.
3. `toPublicPath()` in `k811-cf.js` translates that DAM path to its **published
   public path** using `CF_PATH_MAP`, e.g. `/fragments/kotak-air-card`.
4. The block fetches `/fragments/kotak-air-card.plain.html`, inlines the HTML,
   and rebases any relative media URLs so images resolve.

The DAM→public translation in code is **Part B** below. It only works once the
**Part A** overlay is configured so the public path actually serves HTML.

## Part A — json2html overlay + path mapping (PREREQUISITE, admin side)

This is configured on `admin.hlx.page` (the Config Service), NOT in this repo.
Until it exists, mapped paths 404 and the block renders nothing.

Reference: https://www.aem.live/developer/content-fragment-overlay

**The path-mapping rule to configure (matches this block's `CF_PATH_MAP`):**

```
/content/dam/kotakbank/cards-content-fragments/  :  /fragments/
```

This publishes a CF stored at
`/content/dam/kotakbank/cards-content-fragments/<name>` to the servable path
`/fragments/<name>`.

**Config outline** (exact JSON per the aem.live overlay doc):
- Set up the content-fragment overlay for the site `xeragobiz/kotakbank`.
- Add the path mapping above so the CF DAM folder maps to the `/fragments/`
  prefix.
- Ensure `relativeURLPrefix` is set so CF image/asset URLs are emitted as
  absolute/servable URLs (the doc's mechanism for making DAM images resolve).
- Publish (preview + live) the Content Fragments so their HTML is generated.

**Verify it's live** (should return HTML `200`, not `404`):

```
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://main--kotakbank--xeragobiz.aem.page/fragments/kotak-air-card.plain.html"
```

This project historically avoided the overlay (see
`blocks/cards-featured/CONTENT-FRAGMENT-SETUP.md`, which used a committed JSON
export instead), so Part A must be done to use the `k811-cf` block.

### Deploy status

The ready-to-POST config files live in `.migration/overlay-config/`.

| Step | Target | Status |
|------|--------|--------|
| 1. `public.json` | `admin.hlx.page/config/xeragobiz/sites/kotakbank/public.json` | ✅ POSTed, HTTP 200 |
| 2. `content.json` | `admin.hlx.page/config/xeragobiz/sites/kotakbank/content.json` | ✅ POSTed, HTTP 200 (contentBusId assigned) |
| 3. json2html config | `json2html.adobeaem.workers.dev/config/xeragobiz/kotakbank/main` | ⏳ needs a tokened POST (see below) |
| 4. Publish CFs | AEM author (preview + live) | ⏳ pending |
| 5. Verify | `/fragments/<name>.plain.html` → 200 | ⏳ pending |

**Step 3 — run this yourself** (the json2html worker is a separate service from
admin.hlx.page; its `Authorization` token is NOT auto-injected. The service is
provisioned for this org — it appears in the admin console — so this is purely
an auth step, not a provisioning gap). Do NOT paste the token anywhere shared:

```
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: token <YOUR_ADMIN_API_TOKEN>" \
  --data @.migration/overlay-config/json2html-config.json \
  "https://json2html.adobeaem.workers.dev/config/xeragobiz/kotakbank/main"
```

After a 200 on Step 3, publish the Content Fragments (Step 4), then run the
verify curl (Step 5). No block code change is needed once the overlay serves.

## Part B — code mapping (DONE in this repo)

`blocks/k811-cf/k811-cf.js` → `CF_PATH_MAP`:

```js
const CF_PATH_MAP = [
  {
    damPrefix: '/content/dam/kotakbank/cards-content-fragments/',
    publicPrefix: '/fragments/',
  },
];
```

If the overlay uses a different public prefix, change `publicPrefix` here to
match. Add more entries if CFs live in multiple DAM folders.

## Once Part A is live

No code change needed — selecting a CF in Universal Editor will render its HTML
with DAM images (optimized, from the pipeline). If you chose a public prefix
other than `/fragments/`, update `CF_PATH_MAP` to match and that's it.
