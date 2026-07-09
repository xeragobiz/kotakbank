/* eslint-disable no-underscore-dangle */
/*
 * Credit Card data source helper.
 * Shared by cards-featured and cards-lifestyle to render a card either from
 * inline-authored cells OR from a referenced Credit Card content fragment,
 * resolved against a single JSON data source (GraphQL export committed at
 * /data/credit-cards.json).
 *
 * A reference card item exposes an aem-content field whose value is the
 * fragment path (e.g. /content/dam/kbank-eds/cards-content-fragments/...).
 * That path is matched against each item's `_path` in the JSON.
 */

const DATA_URL = '/data/credit-cards.json';
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

/* map a raw JSON item to the normalized shape the blocks render */
function normalize(item) {
  return {
    path: item._path,
    imageSrc: item.cardimage && item.cardimage._path ? item.cardimage._path : '',
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

/* fetch + index the JSON data source once, keyed by fragment path */
async function loadCardIndex() {
  if (!cardsPromise) {
    cardsPromise = (async () => {
      const resp = await fetch(DATA_URL);
      if (!resp.ok) return new Map();
      const json = await resp.json();
      const items = json?.data?.cardsFeaturedRefList?.items || [];
      return new Map(items.map((it) => [it._path, normalize(it)]));
    })().catch(() => new Map());
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
