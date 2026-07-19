import { getMetadata } from '../../scripts/aem.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch and parse the nav fragment HTML for the given path.
 * @param {string} navPath nav document path without the .plain.html suffix
 * @returns {Promise<Document|null>} parsed fragment document
 */
async function fetchNav(navPath) {
  const resp = await fetch(`${navPath}.plain.html`);
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // re-root any relative image srcs against the nav document's directory so
  // they resolve regardless of the current page path
  const baseDir = navPath.replace(/[^/]+$/, '');
  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|\/|data:)/.test(src)) {
      img.setAttribute('src', `${baseDir}${src}`);
    }
  });
  return doc;
}

/**
 * Close every open top-level menu.
 * @param {Element} menu the nav menu list
 */
function closeAllMenus(menu) {
  menu.querySelectorAll(':scope > li[aria-expanded="true"]').forEach((li) => {
    li.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Build the brand block (logo link) from the first fragment section.
 * @param {Element} section the first fragment section
 * @returns {Element} brand element
 */
const HOME_URL = '/home';

function buildBrand(section) {
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (!section) return brand;
  // the logo always links to the home page. Prefer an author-set logo link
  // (<a><img></a>) but point it at HOME_URL; otherwise wrap the bare logo image.
  const logoLink = section.querySelector('a img')?.closest('a');
  if (logoLink) {
    logoLink.href = HOME_URL;
    logoLink.setAttribute('aria-label', 'Kotak Mahindra Bank home');
    brand.append(logoLink);
  } else {
    const pic = section.querySelector('picture, img');
    if (pic) {
      const a = document.createElement('a');
      a.href = HOME_URL;
      a.setAttribute('aria-label', 'Kotak Mahindra Bank home');
      a.append(pic.closest('picture') || pic);
      brand.append(a);
    }
  }
  return brand;
}

/**
 * Build the tools block (search + login) from the first fragment section.
 * @param {Element} section the first fragment section
 * @returns {Element} tools element
 */
/**
 * Open the site search as a popup overlay on the current page. The search
 * block's markup is pulled from the search page so its authored content
 * (recent seed, most-searched links) is preserved, then decorated in place.
 * @param {string} searchPath the search page path (no .html)
 * @returns {Promise<void>}
 */
async function openSearchPopup(searchPath) {
  if (document.querySelector('.search-popup')) return;

  const overlay = document.createElement('div');
  overlay.className = 'search-popup';
  const backdrop = document.createElement('div');
  backdrop.className = 'search-popup-backdrop';
  const panel = document.createElement('div');
  panel.className = 'search-popup-panel';
  overlay.append(backdrop, panel);

  // load the search block's CSS once (it isn't on the page otherwise)
  if (!document.querySelector('link[data-search-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/blocks/search/search.css';
    link.setAttribute('data-search-css', '');
    document.head.append(link);
  }

  // pull the authored search block from the search page; fall back to a
  // minimal block if it can't be fetched
  let blockEl = null;
  try {
    const resp = await fetch(`${searchPath}.plain.html`);
    if (resp.ok) {
      const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
      blockEl = doc.querySelector('.search');
    }
  } catch (e) { /* ignore — use fallback below */ }
  if (!blockEl) {
    blockEl = document.createElement('div');
    blockEl.className = 'search';
    blockEl.innerHTML = '<div><div><a href="/query-index.json">/query-index.json</a></div></div>';
  }
  panel.append(blockEl);
  document.body.append(overlay);
  document.body.style.overflow = 'hidden';

  const controller = new AbortController();
  const { signal } = controller;
  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
    controller.abort();
  };
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') close();
  }, { signal });
  backdrop.addEventListener('click', close, { signal });
  // the search block's red × closes the whole popup
  blockEl.addEventListener('click', (e) => {
    if (e.target.closest('.search-close')) close();
  }, { signal });

  const { default: decorateSearch } = await import('../search/search.js');
  await decorateSearch(blockEl);
  const input = blockEl.querySelector('.search-input');
  if (input) input.focus();
}

// AI Search backend (public HTTPS endpoint). Kept as a constant so it can be
// swapped without touching the popup logic.
const AI_SEARCH_ENDPOINT = 'https://aemsearch.xerago.com/api/kotak/search';

/* pull the AI answer text out of the API response, tolerating field naming */
function readAiAnswer(data) {
  if (typeof data === 'string') return data;
  return data.answer || data.result || data.response || data.text
    || data.message || data.output || '';
}

/* normalize the AI response "sources" into [{ title, url }], tolerating shapes */
function readAiSources(data) {
  const list = data.sources || data.results || data.citations
    || data.links || data.documents || [];
  return (Array.isArray(list) ? list : [])
    .map((s) => {
      if (typeof s === 'string') return { title: s, url: s };
      const url = s.url || s.path || s.link || s.href || '';
      const title = s.title || s.name || s.heading || s.label || url;
      return { title, url };
    })
    .filter((s) => s.url || s.title);
}

/**
 * Open the AI Search popup: a text prompt that POSTs to the AI endpoint and
 * renders the generated answer plus its source links.
 */
function openAiSearchPopup() {
  if (document.querySelector('.ai-search-popup')) return;

  const overlay = document.createElement('div');
  overlay.className = 'search-popup ai-search-popup';
  const backdrop = document.createElement('div');
  backdrop.className = 'search-popup-backdrop';
  const panel = document.createElement('div');
  panel.className = 'search-popup-panel';
  overlay.append(backdrop, panel);

  panel.innerHTML = `
    <div class="ai-search">
      <div class="ai-search-box">
        <div class="ai-search-field">
          <span class="ai-search-icon" aria-hidden="true"></span>
          <input type="search" class="ai-search-input" placeholder="Ask Kotak AI…" aria-label="Ask Kotak AI">
        </div>
        <button type="button" class="search-close ai-search-close" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e51a24" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div class="ai-search-results" role="status" aria-live="polite"></div>
    </div>`;
  document.body.append(overlay);
  document.body.style.overflow = 'hidden';

  const controller = new AbortController();
  const { signal } = controller;
  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
    controller.abort();
  };
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') close();
  }, { signal });
  backdrop.addEventListener('click', close, { signal });
  panel.querySelector('.ai-search-close').addEventListener('click', close, { signal });

  const input = panel.querySelector('.ai-search-input');
  const results = panel.querySelector('.ai-search-results');

  const runQuery = async () => {
    const text = input.value.trim();
    if (text.length < 2) return;
    results.className = 'ai-search-results ai-search-loading';
    results.textContent = 'Searching…';
    try {
      const resp = await fetch(AI_SEARCH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) throw new Error(`Request failed (${resp.status})`);
      const data = await resp.json().catch(() => ({}));
      const answer = readAiAnswer(data);
      const sources = readAiSources(data);

      results.className = 'ai-search-results';
      results.textContent = '';
      if (answer) {
        const ans = document.createElement('div');
        ans.className = 'ai-search-answer';
        ans.textContent = answer;
        results.append(ans);
      }
      if (sources.length) {
        const h = document.createElement('h3');
        h.className = 'ai-search-sources-heading';
        h.textContent = 'Sources';
        const ul = document.createElement('ul');
        ul.className = 'ai-search-sources';
        sources.forEach((s) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = s.url || '#';
          a.textContent = s.title || s.url;
          li.append(a);
          ul.append(li);
        });
        results.append(h, ul);
      }
      if (!answer && !sources.length) {
        results.textContent = 'No results found.';
      }
    } catch (err) {
      results.className = 'ai-search-results ai-search-error';
      results.textContent = 'Something went wrong. Please try again.';
    }
  };

  input.addEventListener('keyup', (e) => {
    if (e.code === 'Enter') runQuery();
  });
  input.focus();
}

/* AI Search control — sits before the standard search icon in the header */
function buildAiSearchControl() {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-ai-search';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-ai-search-toggle';
  btn.setAttribute('aria-label', 'AI Search');
  btn.innerHTML = '<span class="nav-ai-search-icon" aria-hidden="true"></span><span class="nav-ai-search-label">AI</span>';

  btn.addEventListener('click', () => {
    const open = document.querySelector('.ai-search-popup');
    if (open) {
      open.remove();
      document.body.style.overflow = '';
    } else {
      openAiSearchPopup();
    }
  });

  wrapper.append(btn);
  return wrapper;
}

function buildSearchControl(searchHref) {
  // treat a placeholder anchor (#) or empty value as "no real target" so the
  // control still points at the site search page
  const hasRealHref = searchHref && searchHref !== '#';
  const searchPath = (hasRealHref ? searchHref : '/search').replace(/\.html$/, '');
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-search';

  const link = document.createElement('a');
  link.href = searchPath;
  link.className = 'nav-search-toggle';
  link.setAttribute('aria-label', 'Search');

  // clicking the icon toggles the search popup (open, or close if already open)
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const open = document.querySelector('.search-popup');
    if (open) {
      open.remove();
      document.body.style.overflow = '';
    } else {
      openSearchPopup(searchPath);
    }
  });

  wrapper.append(link);
  return wrapper;
}

function buildTools(section) {
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  if (!section) return tools;

  // Detect search/login from real links first.
  const links = [...section.querySelectorAll('a')].filter((a) => !a.querySelector('img'));
  let hasSearch = false;
  let hasLogin = false;
  let searchHref = '';
  let loginLink = null;
  links.forEach((a) => {
    const label = a.textContent.trim();
    if (/login/i.test(label)) {
      hasLogin = true;
      loginLink = a;
    } else if (/search/i.test(label)) {
      hasSearch = true;
      searchHref = a.getAttribute('href');
    }
  });

  // Fall back to plain text tokens (e.g. authored ":search:" / "Login")
  // so the controls still appear when authors don't add real links.
  const rawText = section.textContent || '';
  if (!hasSearch && /search/i.test(rawText)) hasSearch = true;
  if (!hasLogin && /login/i.test(rawText)) hasLogin = true;

  // AI Search always appears (site-wide), just before the standard search icon
  tools.append(buildAiSearchControl());
  if (hasSearch) tools.append(buildSearchControl(searchHref));
  if (hasLogin) {
    const a = loginLink || document.createElement('a');
    if (!loginLink) {
      a.href = '/';
      a.textContent = 'Login';
    }
    a.className = 'nav-login';
    a.setAttribute('aria-label', 'Login');
    tools.append(a);
  }
  return tools;
}

/**
 * Build the main menu list from the navigation fragment section.
 * @param {Element} section the navigation fragment section
 * @returns {Element} menu element
 */
function buildMenu(section) {
  const menu = section.querySelector('ul');
  if (!menu) return document.createElement('ul');
  menu.className = 'nav-menu';

  // Extract the leading text label of a top-level <li> and remove the source
  // node. UE may render the label as a bare text node, a <p>, or a <pre>.
  const takeLabel = (li) => {
    const textNode = [...li.childNodes]
      .find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (textNode) {
      const txt = textNode.textContent.trim();
      textNode.remove();
      return txt;
    }
    const labelEl = [...li.children]
      .find((c) => (c.tagName === 'P' || c.tagName === 'PRE')
        && !c.querySelector('a') && c.textContent.trim());
    if (labelEl) {
      const txt = labelEl.textContent.trim();
      labelEl.remove();
      return txt;
    }
    return '';
  };

  menu.querySelectorAll(':scope > li').forEach((li) => {
    const panel = li.querySelector(':scope > ul');
    if (panel) {
      li.classList.add('nav-has-panel');
      li.setAttribute('aria-expanded', 'false');
      const label = document.createElement('span');
      label.className = 'nav-label';
      label.textContent = takeLabel(li);
      label.setAttribute('role', 'button');
      label.setAttribute('tabindex', '0');
      li.prepend(label);
      panel.className = 'nav-panel';
      if (panel.querySelector('img')) {
        panel.classList.add('nav-panel-icons');
        panel.querySelectorAll(':scope > li').forEach((groupLi) => {
          if (!groupLi.querySelector(':scope > ul')) return;
          const headTxt = takeLabel(groupLi);
          if (headTxt) {
            const heading = document.createElement('span');
            heading.className = 'nav-panel-heading';
            heading.textContent = headTxt;
            groupLi.prepend(heading);
          }
        });
      }
    }
  });
  return menu;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Mirror the footer block's resolution: default to the bare "/nav" path,
  // which the delivery host maps to the site's nav page (same as "/footer").
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await fetchNav(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  if (!fragment) {
    block.append(nav);
    return;
  }

  const sections = [...fragment.body.children];
  const brand = buildBrand(sections[0]);
  const tools = buildTools(sections[0]);
  const menu = sections[1] ? buildMenu(sections[1]) : document.createElement('ul');

  // hamburger (mobile)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = '<button type="button" aria-controls="nav" aria-label="Open navigation"><span class="nav-hamburger-icon"></span></button>';
  hamburger.addEventListener('click', () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    hamburger.querySelector('button').setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  });

  // panel open/close behavior — hover on desktop, click/tap on mobile
  menu.querySelectorAll(':scope > li.nav-has-panel').forEach((li) => {
    const label = li.querySelector(':scope > .nav-label');

    li.addEventListener('mouseenter', () => {
      if (isDesktop.matches) {
        closeAllMenus(menu);
        li.setAttribute('aria-expanded', 'true');
      }
    });
    li.addEventListener('mouseleave', () => {
      if (isDesktop.matches) li.setAttribute('aria-expanded', 'false');
    });
    const toggle = () => {
      const expanded = li.getAttribute('aria-expanded') === 'true';
      if (!isDesktop.matches) {
        li.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      }
    };
    label.addEventListener('click', toggle);
    label.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        toggle();
      }
    });
  });

  // close desktop menus on outside click / escape
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !nav.contains(e.target)) closeAllMenus(menu);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeAllMenus(menu);
  });

  nav.append(hamburger, brand, menu, tools);

  // reset state when crossing the desktop/mobile breakpoint
  isDesktop.addEventListener('change', () => {
    closeAllMenus(menu);
    nav.setAttribute('aria-expanded', 'false');
    document.body.style.overflowY = '';
    hamburger.querySelector('button').setAttribute('aria-label', 'Open navigation');
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
