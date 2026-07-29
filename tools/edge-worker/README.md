# CF GraphQL same-origin proxy (edge worker)

Lets the credit-card blocks read AEM Content Fragment data live, without CORS.

## Why this exists

- The blocks need the CF data from the AEM publish GraphQL persisted query:
  `https://publish-p165370-e1760075.adobeaemcloud.com/graphql/execute.json/kbank-eds/cardfeaturemodelList`
- That endpoint returns **200 with correct data** but sends **no CORS headers**,
  so a browser on `*.aem.live` / `*.aem.page` is blocked from fetching it
  cross-origin (`net::ERR_FAILED`, "CORS error").
- EDS has **no built-in same-origin proxy**. Per aem.live guidance, backend data
  is fetched via **CDN middleware (an edge worker)**. This worker is that
  middleware: it serves a same-origin path and fetches AEM server-side, so the
  browser never crosses an origin and CORS does not apply.

## What the block calls

`scripts/credit-card.js` fetches the same-origin path **`/api/cf/cardfeaturemodelList`**
first, and falls back to the committed `/data/credit-cards.json` if that path is
not yet served (e.g. before the worker is deployed). No code change is needed
once the worker is live.

## Deploy (Cloudflare Workers)

Prerequisite: the delivery domain must be proxied through **Cloudflare (BYO
CDN)**. If you use a different CDN (Akamai/CloudFront), port `cf-graphql-proxy.js`
to that CDN's edge-compute equivalent (Lambda@Edge / EdgeWorkers) keeping the
same path mapping.

1. Install wrangler and authenticate: `npm i -g wrangler && wrangler login`
2. Edit `wrangler.toml` — set `zone_name` and uncomment the `[[routes]]` for the
   delivery hosts (`.aem.live`, `.aem.page`, and the production apex once live).
3. Deploy: `wrangler deploy`
4. Verify same-origin (expect `200 application/json`):
   ```
   curl -s -o /dev/null -w "%{http_code} %{content_type}\n" \
     "https://main--kotakbank--xeragobiz.aem.live/api/cf/cardfeaturemodelList"
   ```
5. Reload a cards page; the Network tab should show `/api/cf/cardfeaturemodelList`
   succeeding (same-origin, no CORS error) instead of falling back to the JSON.

## Safety / scope

- Only `GET`/`HEAD`, only the allow-listed query name(s) in `ALLOWED_QUERIES`,
  and only the `/api/cf/` prefix — it cannot proxy arbitrary AEM paths.
- Update `ALLOWED_QUERIES` in `cf-graphql-proxy.js` to add more persisted
  queries.
- If the AEM env/program changes, update `AEM_PUBLISH` and `GRAPHQL_CONFIG`.
