/*
 * Placeholder Demo — reads a global value from the site-wide placeholders
 * sheet (/placeholders.json) and renders it. Demonstrates how any block can
 * consume author-managed global variables (site name, currency, care number,
 * URLs, feature flags, …) by key, without hardcoding the value.
 *
 * Authored fields: key (the placeholder Key to look up), label (optional
 * caption shown before the value).
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/* in-memory cache so multiple blocks on a page share one network request */
let placeholdersPromise;

/**
 * Fetch the site-wide placeholders sheet and return a Key→Value map.
 * Served from the site root as /placeholders.json (locale-aware paths like
 * /hi/placeholders.json follow the same shape).
 * @returns {Promise<Record<string, string>>} map of placeholder keys to values
 */
async function fetchPlaceholders() {
  if (!placeholdersPromise) {
    placeholdersPromise = fetch('/placeholders.json')
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => (json.data || []).reduce((map, row) => {
        if (row.Key) map[row.Key] = row.Value;
        return map;
      }, {}))
      .catch(() => ({}));
  }
  return placeholdersPromise;
}

/**
 * loads and decorates the placeholder-demo block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  // classify authored cells: first row = key, optional second row = label
  const key = rows[0]?.textContent.trim() || 'sitename';
  const label = rows[1]?.textContent.trim() || '';

  const placeholders = await fetchPlaceholders();
  const value = placeholders[key];

  const out = document.createElement('div');
  out.className = 'placeholder-demo-content';

  if (label) {
    const caption = document.createElement('span');
    caption.className = 'placeholder-demo-label';
    caption.textContent = label;
    out.append(caption);
  }

  const val = document.createElement('span');
  val.className = 'placeholder-demo-value';
  // missing keys fall back gracefully so authoring mistakes are visible, not fatal
  val.textContent = value ?? `⚠ no placeholder for "${key}"`;
  if (value === undefined) val.classList.add('placeholder-demo-missing');
  out.append(val);

  // preserve Universal Editor instrumentation from the first authored row
  if (rows[0]) moveInstrumentation(rows[0], out);

  block.textContent = '';
  block.append(out);
}
