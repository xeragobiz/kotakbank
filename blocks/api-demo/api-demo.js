/*
 * API Demo — Direct browser fetch vs cloud-based BFF (Adobe App Builder).
 * Two panels fetch the SAME exchange-rate data two ways and render it
 * identically, each logging its response time so the two approaches can be
 * compared side by side.
 *
 * Authored config (single-cell rows, in order): directUrl, bffUrl, base.
 */

const DEFAULT_DIRECT = 'https://open.er-api.com/v6/latest/USD';
const DEFAULT_BASE = 'USD';
// currencies shown in the results table (keeps the demo compact)
const SHOWN = ['EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];

/* fetch a URL and measure wall-clock round-trip time */
async function measuredFetch(url) {
  const start = performance.now();
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  const ms = Math.round(performance.now() - start);
  return { data, ms };
}

/* trim the raw open.er-api response to the shared shape */
function normalizeDirect(raw) {
  const rates = raw.rates || {};
  return {
    base: raw.base_code || DEFAULT_BASE,
    updated: raw.time_last_update_utc || '',
    rates: Object.keys(rates).map((code) => ({ code, rate: rates[code] })),
  };
}

/* the BFF returns the shared shape already; pass it through defensively */
function normalizeBff(raw) {
  if (Array.isArray(raw.rates)) return raw;
  return normalizeDirect(raw);
}

/* render one panel's result table + timer from the shared data shape */
function renderResult(panel, shape, ms) {
  const timer = panel.querySelector('.api-demo-timer');
  const out = panel.querySelector('.api-demo-output');
  timer.textContent = `Response time: ${ms} ms`;

  const shown = shape.rates.filter((r) => SHOWN.includes(r.code));
  const rows = (shown.length ? shown : shape.rates.slice(0, SHOWN.length))
    .map((r) => `<tr><td>${r.code}</td><td>${r.rate}</td></tr>`)
    .join('');
  out.innerHTML = `
    <p class="api-demo-meta">Base ${shape.base}${shape.updated ? ` · ${shape.updated}` : ''}</p>
    <table class="api-demo-table">
      <thead><tr><th>Currency</th><th>Rate</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* show an inline error but still report the elapsed time */
function renderError(panel, message) {
  const timer = panel.querySelector('.api-demo-timer');
  const out = panel.querySelector('.api-demo-output');
  timer.textContent = '';
  out.innerHTML = `<p class="api-demo-error">Request failed: ${message}</p>`;
}

/* build a panel shell (title, fetch button, timer line, output area) */
function buildPanel(title, badge) {
  const panel = document.createElement('div');
  panel.className = 'api-demo-panel';

  const head = document.createElement('div');
  head.className = 'api-demo-panel-head';
  head.innerHTML = `<h3 class="api-demo-panel-title">${title}</h3>`
    + `<span class="api-demo-badge">${badge}</span>`;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'api-demo-fetch';
  btn.textContent = 'Fetch';

  const timer = document.createElement('p');
  timer.className = 'api-demo-timer';

  const out = document.createElement('div');
  out.className = 'api-demo-output';

  panel.append(head, btn, timer, out);
  return { panel, btn };
}

/* wire a panel's Fetch button to load + render, guarding double clicks */
function wirePanel(btn, panel, url, normalize) {
  btn.addEventListener('click', async () => {
    if (!url) {
      renderError(panel, 'no URL configured');
      return;
    }
    btn.disabled = true;
    panel.querySelector('.api-demo-timer').textContent = 'Loading…';
    try {
      const { data, ms } = await measuredFetch(url);
      renderResult(panel, normalize(data), ms);
    } catch (err) {
      renderError(panel, err.message);
    } finally {
      btn.disabled = false;
    }
  });
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // read config from single-cell rows in authored order: directUrl, bffUrl, base
  const values = [...block.children]
    .map((row) => (row.querySelector(':scope > div') || row).textContent.trim());
  const [directUrl, bffUrl, base] = values;
  const direct = directUrl || DEFAULT_DIRECT;
  const baseCode = (base || DEFAULT_BASE).toUpperCase();
  // let the base currency override the default endpoint's path
  const directResolved = direct.replace(/\/[A-Z]{3}$/i, `/${baseCode}`);

  const wrap = document.createElement('div');
  wrap.className = 'api-demo-panels';

  const directPanel = buildPanel('Direct (browser → API)', 'Client-side');
  wirePanel(directPanel.btn, directPanel.panel, directResolved, normalizeDirect);

  const bffPanel = buildPanel('Via BFF (browser → App Builder → API)', 'Server-side');
  wirePanel(bffPanel.btn, bffPanel.panel, bffUrl, normalizeBff);

  wrap.append(directPanel.panel, bffPanel.panel);
  block.textContent = '';
  block.append(wrap);
}
