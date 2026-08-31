import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/** Supported language path prefixes for the multilingual site. */
const SUPPORTED_LANGS = ['en', 'hi'];

/**
 * Returns the language path prefix for the current URL, e.g. '/en' or '/hi'.
 * Returns '' for the default (root) language tree so callers can build paths
 * as `${getLangPrefix()}/footer` and get '/footer' at root, '/en/footer' under /en/.
 * @returns {string} the language prefix ('/en', '/hi') or '' when none applies
 */
export function getLangPrefix() {
  const [, prefix] = window.location.pathname.split('/');
  return SUPPORTED_LANGS.includes(prefix) ? `/${prefix}` : '';
}

/**
 * Derives the document language from the URL path prefix.
 * Falls back to 'en' for the default (root) language tree.
 * @returns {string} the BCP 47 language code (e.g. 'en', 'hi')
 */
function getDocumentLang() {
  return getLangPrefix().slice(1) || 'en';
}

/**
 * Appends the global site name to the page title as " | <SiteName>".
 * Reads the SiteName value from the site-wide placeholders sheet
 * (/placeholders.json) so the suffix is author-managed, not hardcoded.
 * No-ops (leaves the title unchanged) if the sheet or key is unavailable,
 * and is idempotent so the suffix is never appended twice.
 */
async function appendSiteNameToTitle() {
  try {
    const resp = await fetch('/placeholders.json');
    if (!resp.ok) return;
    const json = await resp.json();
    const row = (json.data || []).find((r) => r.Key === 'SiteName');
    const siteName = row && row.Value && row.Value.trim();
    if (!siteName) return;
    const suffix = ` | ${siteName}`;
    if (!document.title.endsWith(suffix)) {
      document.title += suffix;
    }
  } catch (e) {
    // leave the title unchanged if placeholders can't be loaded
  }
}

/**
 * Builds and injects an application/ld+json structured-data script into the
 * document head, driven entirely by page metadata so authors control the
 * values from the UE page properties / the site `metadata` spreadsheet
 * without any per-page code change.
 *
 * The schema TYPE and its values are read from metadata rows (all optional):
 *   - `schema-type`   -> @type (defaults to 'WebPage')
 *   - `schema-name`   -> name (falls back to og:title, then document.title)
 *   - `description` / `og:description` -> description
 *   - `og:image` / `schema-image`      -> image
 *   - `schema-author`                  -> author (Person)
 *   - `schema-date`                    -> datePublished
 * Empty values are dropped so the emitted schema always validates cleanly.
 * No-ops if a `schema-type` of `none` is set (lets authors opt a page out),
 * and is idempotent so the script is never injected twice.
 * @param {Document} doc The document to read metadata from and inject into
 */
function buildStructuredData(doc = document) {
  try {
    const type = (getMetadata('schema-type', doc) || 'WebPage').trim();
    // authors can opt a page out entirely with `schema-type: none`
    if (type.toLowerCase() === 'none') return;
    // idempotency guard: never inject the generated script twice
    if (doc.head.querySelector('script[type="application/ld+json"][data-generated="true"]')) return;

    const canonical = doc.querySelector('link[rel="canonical"]');
    const url = (canonical && canonical.href) || window.location.href;

    const ld = {
      '@context': 'https://schema.org',
      '@type': type,
      name: getMetadata('schema-name', doc)
        || getMetadata('og:title', doc)
        || doc.title,
      description: getMetadata('description', doc) || getMetadata('og:description', doc),
      image: getMetadata('schema-image', doc) || getMetadata('og:image', doc),
      url,
    };

    const author = getMetadata('schema-author', doc);
    if (author) ld.author = { '@type': 'Person', name: author };

    const datePublished = getMetadata('schema-date', doc);
    if (datePublished) ld.datePublished = datePublished;

    // drop empty keys so the schema validates cleanly
    Object.keys(ld).forEach((key) => {
      if (ld[key] === undefined || ld[key] === null || ld[key] === '') delete ld[key];
    });

    const script = doc.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.generated = 'true';
    script.textContent = JSON.stringify(ld);
    doc.head.append(script);
  } catch (e) {
    // never let structured-data generation break page loading
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = getDocumentLang();
  decorateTemplateAndTheme();
  appendSiteNameToTitle();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  // inject metadata-driven application/ld+json structured data (off the LCP path)
  buildStructuredData(doc);

  // Universal Editor support: only load in the editor context to avoid
  // shipping editor-only code to public visitors.
  if (document.querySelector('[data-aue-resource]') || window.location.href.includes('.ue.')) {
    // eslint-disable-next-line import/no-cycle
    import('./editor-support.js');
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
