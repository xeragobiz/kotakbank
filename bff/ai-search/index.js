/*
 * AI Search BFF (Adobe App Builder web action).
 *
 * Purpose: the browser can't call https://aemsearch.xerago.com directly because
 * that API doesn't send CORS headers. This action sits in between:
 *   browser -> this action (CORS allowed for our site) -> xerago (server-to-server)
 * Server-to-server calls have no CORS, so the upstream headers don't matter.
 *
 * Deploy this in your App Builder project (not the EDS repo). The frontend AI
 * search then POSTs { query } to THIS action's web URL instead of xerago.
 *
 * Request  (from browser): POST JSON { "query": "..." }
 * Upstream (to xerago):    POST JSON { "query": "..." } with Content-Type: application/json
 * Response (to browser):   the upstream JSON, plus permissive CORS headers.
 */

/* eslint-disable no-underscore-dangle */
const UPSTREAM = 'https://aemsearch.xerago.com/api/kotak/search';

// origins allowed to call this action (the Kotak EDS hosts). Extend as needed.
const ALLOWED_ORIGINS = [
  /^https:\/\/[a-z0-9-]+--kotakbank--xeragobiz\.aem\.(page|live)$/,
  // add the production custom domain here when known, e.g.:
  // 'https://www.kotak.com',
];

/* pick the CORS origin to echo back: the caller's Origin if it's allowlisted */
function corsOrigin(headers) {
  const origin = headers.origin || headers.Origin || '';
  const ok = ALLOWED_ORIGINS.some(
    (rule) => (rule instanceof RegExp ? rule.test(origin) : rule === origin),
  );
  return ok ? origin : '';
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

async function main(params) {
  const headers = params.__ow_headers || {};
  const origin = corsOrigin(headers);

  // CORS preflight
  if ((params.__ow_method || '').toLowerCase() === 'options') {
    return { statusCode: 204, headers: corsHeaders(origin) };
  }

  const query = (params.query || '').toString().trim();
  if (!query) {
    return { statusCode: 400, headers: corsHeaders(origin), body: { error: 'Missing "query"' } };
  }

  try {
    const resp = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { answer: text }; }
    return { statusCode: resp.status, headers: corsHeaders(origin), body: data };
  } catch (err) {
    return {
      statusCode: 502,
      headers: corsHeaders(origin),
      body: { error: 'Upstream request failed', detail: err.message },
    };
  }
}

exports.main = main;
