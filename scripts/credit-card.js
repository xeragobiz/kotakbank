/* eslint-disable no-underscore-dangle */
/*
 * Credit Card data source helper.
 * Shared by cards-featured and cards-lifestyle to render a card either from
 * inline-authored cells OR from a referenced Credit Card content fragment.
 *
 * Data source: a SAME-ORIGIN path (`/api/cf/...`) served by a CDN edge worker
 * (tools/edge-worker/) that proxies to the AEM publish GraphQL persisted query.
 * The publish GraphQL endpoint sends no CORS headers, so a direct cross-origin
 * fetch is blocked; the same-origin proxy avoids CORS entirely. The committed
 * /data/credit-cards.json snapshot is used as a fallback until the worker is
 * deployed — the live source then takes over automatically with no code change.
 *
 * A reference card item exposes an aem-content field whose value is the
 * fragment path (e.g. /content/dam/kotakbank/cards-content-fragments/...).
 * That path is matched against each item's `_path` in the response.
 */

// Live CF data via a SAME-ORIGIN path. A CDN edge worker (see
// tools/edge-worker/cf-graphql-proxy.js) proxies this path to the AEM publish
// GraphQL persisted query, so the browser makes a same-origin request and CORS
// never applies. Until the worker is deployed this path 404s and the code falls
// back to the committed snapshot below.
const LIVE_URL = '/api/cf/cardfeaturemodelList';
// Committed snapshot used as a fallback when the live source is unavailable.
const FALLBACK_URL = '/data/credit-cards.json';
let cardsPromise;

/* strip an html-field wrapper down to plain text (e.g. filtertags <p>Fuel</p>) */
function htmlToText(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent.trim();
}

/* parse a features html field into a <ul> element (or null) */
function htmlToList(html) {
  if (!html) return null;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const list = tmp.querySelector('ul, ol');
  if (!list) return null;
  // drop inline styles the RTE injected; the block CSS owns presentation
  list.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
  return list;
}

/* combine joining + annual fee fields into one line */
function feesLine(item) {
  return [item.joiningfee, item.annualfee].filter(Boolean).join('   ').trim();
}

// Publish host that serves the DAM/Dynamic Media assets for this environment.
const PUBLISH_HOST = 'https://publish-p165370-e1760075.adobeaemcloud.com';

/*
 * Resolve a cardimage object to a browser-renderable image URL.
 * Prefer the Dynamic Media delivery URL (`_dynamicUrl`) served inline by the
 * publish host — it is optimized and, unlike the plain `_publishUrl` (which the
 * publish tier serves as `content-disposition: attachment`, so browsers won't
 * render it in <img>), it carries `content-disposition: inline`.
 * `_dynamicUrl` is host-relative, so prefix the publish host. Fall back to an
 * already-absolute URL if present. `DocumentRef` images have no URL → ''.
 */
function cardImageSrc(img) {
  if (!img) return '';
  if (img._dynamicUrl) {
    return img._dynamicUrl.startsWith('http') ? img._dynamicUrl : `${PUBLISH_HOST}${img._dynamicUrl}`;
  }
  return img._publishUrl || '';
}

/* map a raw JSON item to the normalized shape the blocks render */
function normalize(item) {
  return {
    path: item._path,
    imageSrc: cardImageSrc(item.cardimage),
    imageAlt: item.cardname || '',
    highlight: item.highlight || '',
    highlightSub: item.highlightsub || '',
    name: item.cardname || '',
    badge: item.badge || '',
    fees: feesLine(item),
    feesParts: [item.joiningfee, item.annualfee].filter(Boolean),
    featuresList: htmlToList(item.features && item.features.html),
    tags: htmlToText(item.filtertags && item.filtertags.html),
    // default Apply links to the application page, carrying the card name so
    // the form can show/record which card the applicant chose
    applyHref: item.applylink || `/apply?card=${encodeURIComponent(item.cardname || '')}`,
    applyText: item.applytext || '',
    compareHref: item.comparelink || '#',
    compareText: item.comparetext || '',
    knowMoreHref: item.knowmorelink || '#',
    knowMoreText: item.knowmoretext || '',
  };
}

/* pull the items array out of a GraphQL response without assuming the query
 * root key name (persisted queries expose it under their own list field) */
function extractItems(json) {
  const root = json && json.data;
  if (!root) return [];
  const list = Object.values(root).find((v) => v && Array.isArray(v.items));
  return list ? list.items : [];
}

/* fetch a URL and return its normalized items array, or null on any failure */
async function fetchItems(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return extractItems(await resp.json());
  } catch (e) {
    // network/CORS failure — signal the caller to try the fallback
    return null;
  }
}

/* index the data source once, keyed by fragment path. Prefer the live GraphQL
 * endpoint; fall back to the committed snapshot if it is unavailable. */
async function loadCardIndex() {
  if (!cardsPromise) {
    cardsPromise = (async () => {
      const items = (await fetchItems(LIVE_URL)) || (await fetchItems(FALLBACK_URL)) || [];
      return new Map(items.map((it) => [it._path, normalize(it)]));
    })();
  }
  return cardsPromise;
}

/**
 * Resolve a referenced Credit Card fragment to normalized card data.
 * @param {string} path fragment path from an aem-content reference
 * @returns {Promise<object|null>} normalized card data, or null if not found
 */
export async function loadCreditCard(path) {
  if (!path) return null;
  const clean = path.replace(/(\.plain)?\.html$/, '');
  const index = await loadCardIndex();
  const cached = index.get(clean);
  if (!cached) return null;
  // return a fresh copy each call: the cached featuresList is a live DOM node,
  // so multiple blocks (featured + lifestyle) sharing it would move it out of
  // whichever rendered first. Clone it per consumer.
  return {
    ...cached,
    featuresList: cached.featuresList ? cached.featuresList.cloneNode(true) : null,
  };
}

/**
 * Whether a row is a Credit Card reference item. A reference item is tagged
 * with a *-ref model in Universal Editor (present even before its fragment
 * field is filled), or — outside the editor — is a single-anchor row pointing
 * at a fragment path with no image/content cells of its own.
 * @param {Element} row the item row
 * @returns {boolean}
 */
export function isCardReference(row) {
  const model = row.getAttribute('data-aue-model') || '';
  if (model.endsWith('-ref')) return true;
  if (row.querySelector('picture')) return false;
  const anchors = row.querySelectorAll('a');
  if (anchors.length !== 1) return false;
  const href = anchors[0].getAttribute('href') || '';
  // outside the editor, only treat a bare link to a Credit Card fragment path
  // as a reference (avoids capturing a "View all" or bottom-CTA link)
  return /\/cards-content-fragments\//.test(href)
    && anchors[0].textContent.trim() === row.textContent.trim();
}

/**
 * The fragment path referenced by a reference item, or '' if not yet set.
 * @param {Element} row the item row
 * @returns {string}
 */
export function cardReferencePath(row) {
  const anchors = row.querySelectorAll('a');
  if (anchors.length !== 1) return '';
  const href = anchors[0].getAttribute('href') || '';
  return href.startsWith('/') && !href.startsWith('//') ? href : '';
}
