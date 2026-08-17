import { getMetadata } from '../../scripts/aem.js';

/**
 * Fetch and parse the footer fragment HTML for the given path.
 * @param {string} footerPath footer document path without the .plain.html suffix
 * @returns {Promise<Document|null>} parsed fragment document
 */
const IMG_EXT = /\.(?:png|jpe?g|webp|gif|svg)(?:\?|$)/i;

async function fetchFooter(footerPath) {
  const resp = await fetch(`${footerPath}.plain.html`);
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const baseDir = footerPath.replace(/[^/]+$/, '');
  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|\/|data:)/.test(src)) {
      img.setAttribute('src', `${baseDir}${src}`);
    }
  });
  // Authors may paste image asset paths as link text instead of inserting an
  // image. Convert any link whose href OR text is an image path into an <img>.
  doc.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const txt = a.textContent.trim();
    let path = '';
    if (IMG_EXT.test(href)) path = href;
    else if (IMG_EXT.test(txt)) path = txt;
    if (path) {
      const img = document.createElement('img');
      img.src = path;
      img.alt = '';
      img.loading = 'lazy';
      a.replaceWith(img);
    }
  });
  // Authors may also paste literal "<img ...>" tags as text (sometimes with
  // spaces stripped, e.g. "<imgsrc=..."). Find any element whose own text
  // contains such markup and replace it with the real image(s).
  doc.querySelectorAll('li, p, div, span').forEach((el) => {
    // only act on elements that directly hold the img-markup text
    if (!/<img/i.test(el.textContent || '')) return;
    if (![...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && /<img/i.test(n.textContent))) return;
    const raw = el.textContent;
    const imgTags = raw.match(/<img[^>]*>/gi);
    if (!imgTags) return;
    const frag = doc.createDocumentFragment();
    imgTags.forEach((tag) => {
      const srcMatch = tag.match(/src\s*=\s*["']([^"']+)["']/i);
      if (!srcMatch) return;
      const altMatch = tag.match(/alt\s*=\s*["']([^"']*)["']/i);
      const img = document.createElement('img');
      const [, srcVal] = srcMatch;
      img.src = srcVal;
      img.alt = altMatch ? altMatch[1] : '';
      img.loading = 'lazy';
      frag.append(img);
    });
    if (frag.childNodes.length) {
      el.textContent = '';
      el.append(frag);
    }
  });
  return doc;
}

// headings that render as full-width rows (inline links) above the grid
const WIDE_TITLES = ['channel red', 'popular products', 'help center'];

/**
 * Build footer link columns from a section, splitting them into wide
 * full-width rows (Channel Red / Popular Products / Help Center) and the
 * standard grid columns.
 * @param {Element} section the fragment section
 * @returns {{ wide: Element[], columns: Element[] }}
 */
function buildLinkColumns(section) {
  const wide = [];
  const columns = [];
  // Headings/lists may be nested inside a content wrapper div, so find the
  // headings anywhere in the section and pair each with the next list.
  section.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((node) => {
    const label = node.textContent.trim();
    const isWide = WIDE_TITLES.includes(label.toLowerCase());
    const col = document.createElement('div');
    col.className = isWide ? 'footer-wide' : 'footer-col';
    const title = document.createElement('p');
    title.className = 'footer-col-title';
    title.textContent = label;
    col.append(title);
    const list = node.nextElementSibling;
    if (list && list.tagName === 'UL') {
      list.classList.add(isWide ? 'footer-wide-links' : 'footer-col-links');
      col.append(list);
    }
    // collapse on mobile: tap the title to reveal its links (both the grid
    // columns and the wide full-width rows behave as accordions on mobile)
    if (list && list.tagName === 'UL') {
      // aria-expanded belongs on the interactive title (role=button); the col
      // carries a data attribute the CSS uses to drive the accordion visuals.
      col.dataset.expanded = 'false';
      title.setAttribute('role', 'button');
      title.setAttribute('tabindex', '0');
      title.setAttribute('aria-expanded', 'false');
      const toggle = () => {
        const open = col.dataset.expanded === 'true';
        col.dataset.expanded = open ? 'false' : 'true';
        title.setAttribute('aria-expanded', open ? 'false' : 'true');
      };
      title.addEventListener('click', toggle);
      title.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    }
    (isWide ? wide : columns).push(col);
  });
  return { wide, columns };
}

/**
 * Build the connect/app/trust section.
 * @param {Element} section the second fragment section
 * @returns {Element} connect element
 */
const SOCIAL_NAMES = ['facebook', 'twitter', 'youtube', 'linkedin', 'instagram'];

function buildConnect(section) {
  const wrap = document.createElement('div');
  wrap.className = 'footer-connect';

  // --- Social: structure-independent. Find every element whose text is a
  // known social name and rebuild a clean icon list, regardless of nesting. ---
  const social = document.createElement('div');
  social.className = 'footer-social';

  // pick a label heading for the social group if one is present
  const labelEl = [...section.querySelectorAll('h1, h2, h3, h4, h5, h6, p')]
    .find((el) => /connect|follow|social/i.test(el.textContent || ''));
  if (labelEl) {
    const t = document.createElement('p');
    t.className = 'footer-col-title';
    t.textContent = labelEl.textContent.trim();
    social.append(t);
  }

  const socialList = document.createElement('ul');
  socialList.className = 'footer-social-list';
  const seen = new Set();
  section.querySelectorAll('a, li').forEach((el) => {
    if (el.querySelector('a, li, ul')) return; // only leaf nodes
    const name = el.textContent.trim();
    const key = name.toLowerCase();
    if (!SOCIAL_NAMES.includes(key) || seen.has(key)) return;
    seen.add(key);
    const href = el.tagName === 'A' ? el.getAttribute('href') : (el.querySelector('a')?.getAttribute('href'));
    const a = document.createElement('a');
    a.href = href || '#';
    a.className = `footer-social-${key}`;
    a.setAttribute('aria-label', name);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
    const li = document.createElement('li');
    li.append(a);
    socialList.append(li);
  });
  if (socialList.children.length) social.append(socialList);
  wrap.append(social);

  // --- App: store/trust badges from loose images (no QR) ---
  const looseImages = [...section.querySelectorAll('img')];
  const app = document.createElement('div');
  app.className = 'footer-app';
  const appLabel = [...section.querySelectorAll('h1, h2, h3, h4, h5, h6, p')]
    .find((el) => /install|app|download/i.test(el.textContent || ''));
  if (appLabel) {
    const t = document.createElement('p');
    t.className = 'footer-col-title';
    t.textContent = appLabel.textContent.trim();
    app.append(t);
  }
  if (looseImages.length) {
    const badges = document.createElement('div');
    badges.className = 'footer-badges';
    // The authored badge images point at /content/dam paths that the EDS
    // origin can't serve. Repoint each to a committed /icons/footer asset by
    // matching its alt/src to the badge type.
    const badgeFor = (img) => {
      const key = `${img.getAttribute('alt') || ''} ${img.getAttribute('src') || ''}`.toLowerCase();
      if (/google\s*play|play\s*store/.test(key)) return '/icons/footer/google-play.webp';
      if (/app\s*store|apple/.test(key)) return '/icons/footer/apple-store.webp';
      if (/verisign/.test(key)) return '/icons/footer/verisign.webp';
      if (/entrust/.test(key)) return '/icons/footer/entrust.webp';
      return '';
    };
    looseImages.forEach((img) => {
      const rebased = badgeFor(img);
      if (rebased) {
        const clean = document.createElement('img');
        clean.src = rebased;
        clean.alt = img.getAttribute('alt') || '';
        clean.loading = 'lazy';
        badges.append(clean);
      } else {
        badges.append(img);
      }
    });
    app.append(badges);
  }
  wrap.append(app);

  // eslint-disable-next-line no-use-before-define
  buildGroupCompanies(section, wrap);
  return wrap;
}

/**
 * Build the "Kotak Group Companies" dropdown from authored content. Handles two
 * authoring shapes:
 *   1) a heading/paragraph "…Group Companies" followed by a link list, and
 *   2) a list item "…Group Companies" that nests its links in a child <ul>.
 * The links become <option>s; the label becomes the placeholder.
 * @param {Element} section the fragment section to search
 * @param {Element} wrap the connect wrapper to append the dropdown to
 */
function buildGroupCompanies(section, wrap) {
  // find the label element whose own text mentions "group compan"
  const isLabel = (el) => {
    const ownText = [...el.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE || n.tagName === 'STRONG' || n.tagName === 'EM')
      .map((n) => n.textContent)
      .join(' ');
    return /group compan/i.test(ownText);
  };
  const labelEl = [...section.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, strong')]
    .find(isLabel);
  if (!labelEl) return;

  // links come from a nested <ul> (list-item shape) or the next <ul> sibling
  let list = labelEl.querySelector(':scope ul');
  if (!list) {
    const nodes = [...section.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, ul')];
    const idx = nodes.indexOf(labelEl);
    list = nodes.slice(idx + 1).find((n) => n.tagName === 'UL') || null;
  }
  const anchors = list ? [...list.querySelectorAll('a')] : [];
  if (!anchors.length) return;

  // label = the element's own direct text (exclude the nested link list text)
  const ownText = [...labelEl.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE
      || (n.nodeType === Node.ELEMENT_NODE && n.tagName !== 'UL' && n.tagName !== 'OL'))
    .map((n) => n.textContent.trim())
    .join(' ')
    .trim();
  const labelText = ownText || 'Kotak Group Companies';

  const dd = document.createElement('div');
  dd.className = 'footer-group-companies';
  const select = document.createElement('select');
  select.className = 'footer-group-select';
  select.setAttribute('aria-label', labelText);
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = labelText;
  placeholder.selected = true;
  placeholder.disabled = true;
  select.append(placeholder);
  anchors.forEach((a) => {
    const opt = document.createElement('option');
    opt.value = a.getAttribute('href') || '#';
    opt.textContent = a.textContent.trim();
    select.append(opt);
  });
  select.addEventListener('change', () => {
    if (select.value) window.open(select.value, '_blank', 'noopener');
    select.selectedIndex = 0;
  });
  dd.append(select);
  wrap.append(dd);
}

/**
 * Build the bottom copyright bar.
 * @param {Element} section the third fragment section
 * @returns {Element} copyright element
 */
function buildCopyright(section) {
  const bar = document.createElement('div');
  bar.className = 'footer-copyright';
  // inner container so the content aligns with the main footer content column
  const inner = document.createElement('div');
  inner.className = 'footer-copyright-inner';
  const text = section.querySelector('p');
  if (text) inner.append(text);
  // rebuild the legal links as a clean flat list (authored lists may be nested)
  const anchors = [...section.querySelectorAll('a')];
  if (anchors.length) {
    const links = document.createElement('ul');
    links.className = 'footer-legal-links';
    anchors.forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = a.getAttribute('href') || '#';
      link.textContent = a.textContent.trim();
      li.append(link);
      links.append(li);
    });
    inner.append(links);
  }
  bar.append(inner);
  return bar;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await fetchFooter(footerPath);

  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.body.children];
  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  // Classify each section by content rather than position:
  // - connect: mentions "connect with us" or "install the" app, or has images
  // - copyright: has a paragraph starting with "copyright"/"©"
  // - columns: everything else (heading + link-list groups)
  let connectSection = null;
  let copyrightSection = null;
  const columnSections = [];
  sections.forEach((sec) => {
    const text = (sec.textContent || '').toLowerCase();
    if (/connect with us|install the/.test(text)) {
      connectSection = connectSection || sec;
    } else if (/copyright|©/.test(text)) {
      copyrightSection = copyrightSection || sec;
    } else {
      columnSections.push(sec);
    }
  });

  const wideWrap = document.createElement('div');
  wideWrap.className = 'footer-wide-group';
  const columnsWrap = document.createElement('div');
  columnsWrap.className = 'footer-columns';
  columnSections.forEach((sec) => {
    const { wide, columns } = buildLinkColumns(sec);
    wide.forEach((el) => wideWrap.append(el));
    columns.forEach((el) => columnsWrap.append(el));
  });
  if (wideWrap.children.length) footer.append(wideWrap);
  if (columnsWrap.children.length) footer.append(columnsWrap);

  if (connectSection) footer.append(buildConnect(connectSection));
  block.append(footer);

  if (copyrightSection) block.append(buildCopyright(copyrightSection));
}
