/*
 * CF GraphQL same-origin proxy — Cloudflare Worker.
 *
 * Purpose: the kotak811 credit-card blocks need the AEM Content Fragment data
 * from the publish-tier GraphQL persisted query, but that endpoint sends no
 * CORS headers, so a browser on the EDS domain cannot fetch it cross-origin.
 * This worker is mapped to a SAME-ORIGIN path on the delivery domain
 * (`/api/cf/*`) and fetches the AEM publish endpoint server-side, so the
 * browser request never crosses an origin and CORS does not apply.
 *
 * Route (Cloudflare dashboard → Workers Routes, or wrangler):
 *   main--kotakbank--xeragobiz.aem.live/api/cf/*   -> this worker
 *   main--kotakbank--xeragobiz.aem.page/api/cf/*   -> this worker
 * (add the apex/custom production domain route too, once live)
 *
 * Mapping: /api/cf/<queryName>  ->  <AEM_PUBLISH>/graphql/execute.json/<CONFIG>/<queryName>
 * Only GET is allowed and only an allow-listed set of query names, so this
 * cannot be used to proxy arbitrary AEM paths.
 */

const AEM_PUBLISH = 'https://publish-p165370-e1760075.adobeaemcloud.com';
const GRAPHQL_CONFIG = 'kbank-eds';
// allow-list of persisted-query names this proxy may serve
const ALLOWED_QUERIES = new Set(['cardfeaturemodelList']);
const PREFIX = '/api/cf/';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    if (!url.pathname.startsWith(PREFIX)) {
      return new Response('Not Found', { status: 404 });
    }

    const queryName = url.pathname.slice(PREFIX.length).replace(/\/+$/, '');
    if (!ALLOWED_QUERIES.has(queryName)) {
      return new Response('Not Found', { status: 404 });
    }

    const upstream = `${AEM_PUBLISH}/graphql/execute.json/${GRAPHQL_CONFIG}/${queryName}${url.search}`;

    const resp = await fetch(upstream, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      // cache at the edge; the persisted query already sets cache-control
      cf: { cacheTtl: 60, cacheEverything: true },
    });

    // pass the body through, same-origin (no CORS header needed since the
    // browser sees this as its own origin). Preserve JSON content type.
    const headers = new Headers();
    headers.set('content-type', resp.headers.get('content-type') || 'application/json');
    headers.set('cache-control', 'public, max-age=60, stale-while-revalidate=86400');
    return new Response(resp.body, { status: resp.status, headers });
  },
};
