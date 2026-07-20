# AI Search BFF (App Builder)

This folder holds the **backend-for-frontend** action that proxies AI Search
requests to `https://aemsearch.xerago.com/api/kotak/search`, so the browser
never calls xerago directly and CORS is under our control.

> These files are meant to be dropped into your **Adobe App Builder** project
> and deployed with `aio app deploy`. They do not run inside this EDS repo (the
> `bff/` folder is excluded from the served site via `.hlxignore`).

## Files
- `ai-search/index.js` — the web action. Accepts `POST { query }`, forwards it
  to xerago server-to-server, returns the JSON with CORS headers for our hosts.

## Add to your App Builder `app.config.yaml`
```yaml
application:
  runtimeManifest:
    packages:
      kotak:
        license: Apache-2.0
        actions:
          ai-search:
            function: actions/ai-search/index.js
            web: 'yes'
            runtime: nodejs:18
            annotations:
              require-adobe-auth: false
              final: true
```
(Place the file at `actions/ai-search/index.js` in the App Builder project, or
adjust the `function:` path to wherever you copy it.)

## Deploy
```bash
aio app deploy
```
Copy the printed web action URL, e.g.
`https://<ns>.adobeioruntime.net/api/v1/web/kotak/ai-search`.

## Point the frontend at it
In `blocks/header/header.js`, set `AI_SEARCH_ENDPOINT` to that URL (replacing
the direct xerago URL). The request/response shape is unchanged, so nothing
else needs to change.

## Allowed origins
Edit `ALLOWED_ORIGINS` in `ai-search/index.js` to include your production
domain when known. The `*--kotakbank--xeragobiz.aem.(page|live)` preview/live
hosts are already covered.
