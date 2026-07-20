import { createOptimizedPicture } from '../../scripts/aem.js';
import openEligibilityModal from '../../scripts/eligibility-modal.js';

// application page the eligibility modal's "Apply Now" redirects to
const APPLY_PAGE = '/apply';

/**
 * Emit media-scoped <link rel="preload" as="image"> tags into <head> for the
 * WebP <source>s of a hero <picture>, so the preload scanner can discover the
 * JS-built LCP image immediately (it isn't in the initial HTML). Only the
 * art-directed WebP sources (mobile + desktop) are preloaded so exactly one
 * fetch fires per viewport — no duplicate PNG/default fetches.
 * @param {HTMLPictureElement} picture the decorated hero picture
 */
function preloadPicture(picture) {
  const links = [];
  picture.querySelectorAll('source[type="image/webp"][media]').forEach((source) => {
    const srcset = source.getAttribute('srcset');
    if (!srcset) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.setAttribute('imagesrcset', srcset);
    link.setAttribute('media', source.getAttribute('media'));
    link.setAttribute('type', 'image/webp');
    link.setAttribute('fetchpriority', 'high');
    links.push(link);
  });
  if (links.length) document.head.append(...links);
}

/**
 * CC Hero — full-width banner with a background image and overlaid
 * heading, subtext, and up to two CTAs (primary + secondary).
 * Cells are identified by content (not fixed positions) because field
 * collapsing merges link+text pairs, so the rendered cell count varies:
 *   - a cell with a <picture> is the background image
 *   - a cell with heading/paragraph rich text is the copy
 *   - each remaining cell with an <a> is a CTA (1st = primary, 2nd = secondary)
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r);

  // the image group is one cell that may hold one or two <picture>s
  // (desktop first, optional mobile second — they share the bg_ group).
  const imageCell = cells.find((c) => c.querySelector('picture'));
  const pictures = imageCell ? [...imageCell.querySelectorAll('picture')] : [];
  const linkCells = cells.filter((c) => c !== imageCell && c.querySelector('a'));
  // alt text = a short text-only cell (no links, no headings)
  const altCell = cells.find((c) => c !== imageCell
    && !c.querySelector('a, h1, h2, h3, h4, h5, h6, ul, ol')
    && c.textContent.trim()
    && c.textContent.trim().length < 120
    && !c.querySelector('p:nth-of-type(2)'));
  // copy = the cell holding the heading/paragraphs
  const copyCell = cells.find((c) => c !== imageCell && c !== altCell
    && !c.querySelector('a')
    && c.querySelector('h1, h2, h3, h4, h5, h6, p'));

  // heading/text colour selects share the copy cell's field group, so they
  // render as trailing plain <p>s whose text is a colour token. Pull them out
  // (in model order: heading colour first, text colour second) and remove
  // those paragraphs so they don't show as body copy.
  const COLORS = ['orange', 'blue', 'white'];
  const colorValues = [];
  // the "detail" variant (product-detail hero) can show a "Recommended" ribbon;
  // authored as a leading plain <p> with that exact text, pulled out like colours.
  let badgeText = '';
  // the Layout and Gradient selects share the copy field group, so their values
  // ("detail", "gradient-red", ...) also render as trailing plain <p>s — pull
  // them out and apply them as variant classes.
  const LAYOUTS = ['detail'];
  const GRADIENTS = ['gradient-red', 'gradient-dark'];
  if (copyCell) {
    [...copyCell.querySelectorAll('p')].forEach((p) => {
      const token = p.textContent.trim().toLowerCase();
      if (p.querySelector('a, strong, em, picture')) return;
      if (COLORS.includes(token)) {
        colorValues.push(token);
        p.remove();
      } else if (token === 'recommended') {
        badgeText = p.textContent.trim();
        p.remove();
      } else if (LAYOUTS.includes(token) || GRADIENTS.includes(token)) {
        block.classList.add(token);
        p.remove();
      }
    });
  }
  const headingColor = colorValues[0] || '';
  const textColor = colorValues[1] || '';

  const altText = altCell ? altCell.textContent.trim() : '';

  // background image (LCP candidate). When a mobile image is authored, use a
  // <picture> with a mobile <source>; otherwise a single responsive image.
  const media = document.createElement('div');
  media.className = 'cc-hero-image';
  const desktopImg = pictures[0] ? pictures[0].querySelector('img') : null;
  const mobileImg = pictures[1] ? pictures[1].querySelector('img') : null;
  if (desktopImg) {
    if (altText) desktopImg.setAttribute('alt', altText);
    const optimized = createOptimizedPicture(
      desktopImg.src,
      desktopImg.getAttribute('alt') || '',
      true,
      [{ media: '(min-width: 900px)', width: '1600' }, { width: '750' }],
    );
    // art-directed mobile source: prepend so the browser picks it below 900px.
    // Serve optimized WebP (not the raw PNG) so the mobile LCP image is small.
    if (mobileImg) {
      const src = new URL(mobileImg.src, window.location.href);
      src.searchParams.set('width', '750');
      src.searchParams.set('format', 'webply');
      src.searchParams.set('optimize', 'medium');
      const source = document.createElement('source');
      source.setAttribute('type', 'image/webp');
      source.setAttribute('media', '(max-width: 899px)');
      source.setAttribute('srcset', src.toString());
      optimized.prepend(source);
    }
    const img = optimized.querySelector('img');
    img.setAttribute('fetchpriority', 'high');
    // Reserve space at the image's REAL aspect ratio to avoid layout shift
    // (CLS). On desktop the hero shows the full image (object-fit: contain,
    // height: auto), so a wrong ratio here would reserve the wrong height and
    // reflow when the image loads. Carry over the authored dimensions.
    const w = desktopImg.getAttribute('width') || desktopImg.naturalWidth;
    const h = desktopImg.getAttribute('height') || desktopImg.naturalHeight;
    if (w && h) {
      img.setAttribute('width', w);
      img.setAttribute('height', h);
    }
    media.append(optimized);

    // Make the LCP image discoverable to the preload scanner: this hero is
    // built in JS (so it isn't in the initial HTML). Emit media-scoped
    // <link rel=preload> per <source> so the browser fetches the correct
    // (mobile vs desktop) image immediately with high priority.
    preloadPicture(optimized);
  } else if (pictures[0]) {
    media.append(pictures[0]);
  }

  // content overlay
  const content = document.createElement('div');
  content.className = 'cc-hero-content';
  if (headingColor) content.classList.add(`cc-hero-heading-${headingColor}`);
  if (textColor) content.classList.add(`cc-hero-text-${textColor}`);
  // "Recommended" ribbon (detail variant) sits above the copy
  if (badgeText) {
    const badge = document.createElement('span');
    badge.className = 'cc-hero-badge';
    badge.textContent = badgeText;
    content.append(badge);
  }
  if (copyCell) {
    while (copyCell.firstChild) content.append(copyCell.firstChild);
  }

  // CTAs — first link cell = primary, second = secondary
  const actions = document.createElement('div');
  actions.className = 'cc-hero-actions';
  linkCells.forEach((c, i) => {
    const link = c.querySelector('a');
    if (!link) return;
    link.className = i === 0
      ? 'cc-hero-btn cc-hero-btn-primary'
      : 'cc-hero-btn cc-hero-btn-secondary';
    // a "Check Eligibility" CTA opens the quick-check modal instead of
    // navigating; its result panel's Apply Now goes to the application page
    if (/eligibility/i.test(link.textContent)) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openEligibilityModal(APPLY_PAGE);
      });
    } else if (/find my card/i.test(link.textContent)) {
      // "Find My Card" scrolls to the cards-lifestyle section on the page
      link.addEventListener('click', (e) => {
        const target = document.querySelector('.cards-lifestyle');
        if (!target) return; // no such section on this page — let the link be
        e.preventDefault();
        (target.closest('.section') || target).scrollIntoView({ behavior: 'smooth' });
      });
    }
    actions.append(link);
  });
  if (actions.children.length) content.append(actions);

  block.textContent = '';
  block.append(media, content);

  // Mobile back button at the top of the hero (the breadcrumb is hidden on
  // mobile). Built here — not in the breadcrumb block — so it doesn't depend
  // on section load order. Three sources:
  //  - detail variant: label + link from the page breadcrumb's parent crumb
  //    (falls back to browser-back when that isn't a usable link)
  //  - apply page (page has an apply-form): fixed "Credit Cards" + browser-back
  //  - index/cards listing page: fixed "Back to Home" linking to /home
  const isApplyPage = !!document.querySelector('.apply-form');
  // the credit-cards index document is served at the site root ("/") as well
  // as "/index"; match both (but not "/home", which is the separate homepage).
  const { pathname } = window.location;
  const isIndexPage = pathname === '/' || /\/index(\.html)?$/.test(pathname);
  const wantsBack = block.classList.contains('detail') || isApplyPage || isIndexPage;
  if (wantsBack && !block.querySelector('.cc-hero-back')) {
    let href = '#';
    let text = 'Credit Cards';
    let useHistory = true;
    if (block.classList.contains('detail')) {
      const crumbLinks = document.querySelectorAll(
        '.breadcrumb a.breadcrumb-link, .breadcrumb-wrapper a[href], .breadcrumb a[href]',
      );
      const parent = crumbLinks[crumbLinks.length - 1];
      const parentHref = parent ? parent.getAttribute('href') : '';
      const parentLabel = parent ? parent.textContent.trim() : '';
      if (parentHref && parentHref !== '#') {
        href = parentHref;
        useHistory = false;
      }
      if (parentLabel && parentLabel !== '#') text = parentLabel;
    } else if (isIndexPage) {
      href = '/home';
      text = 'Back to Home';
      useHistory = false;
    }
    const back = document.createElement('a');
    back.className = 'cc-hero-back';
    back.href = href;
    back.innerHTML = `<span class="cc-hero-back-icon" aria-hidden="true"></span><span>${text}</span>`;
    if (useHistory) {
      back.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.back();
      });
    }
    block.classList.add('cc-hero-has-back');
    block.prepend(back);
  }
}
