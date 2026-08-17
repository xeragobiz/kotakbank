import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * K811 CF — renders an AEM Content Fragment referenced by path.
 *
 * In the modern EDS model, a published Content Fragment is delivered as its own
 * self-contained semantic HTML page (via the json2html overlay). This block
 * takes a CF *reference* (a DAM path chosen in Universal Editor, or a plain path
 * in the block cell), translates the DAM path to its published public path
 * (see CF_PATH_MAP / CONTENT-FRAGMENT-SETUP.md), and inlines that CF's published
 * HTML into the page — the same fetch-and-inline approach the platform
 * `fragment` block uses for page fragments, but scoped for kotak811 CF content.
 *
 * Prerequisite: the json2html overlay + path mapping must be configured on
 * admin.hlx.page (Part A in CONTENT-FRAGMENT-SETUP.md); otherwise the mapped
 * path 404s and nothing renders.
 *
 * Content contract (rows in model order):
 *   1. reference — the Content Fragment (aem-content reference → <a href>, or a
 *                  cell whose text is the CF path)
 *
 * If no reference is set yet (e.g. a block just added in Universal Editor) a
 * placeholder is shown while authoring; on the live site the empty block is
 * cleared rather than leaving broken markup.
 */

// Content Fragments are authored in the DAM but published to a servable HTML
// path via the json2html overlay + path mapping (configured on admin.hlx.page).
// An `aem-content` reference hands us the DAM path, so we translate it to the
// mapped public path before fetching. Keep this in sync with the overlay's
// path-mapping rule. Example rule: `/content/dam/kotakbank/cf/:/fragments/`.
const CF_PATH_MAP = [
  {
    damPrefix: '/content/dam/kotakbank/cards-content-fragments/',
    publicPrefix: '/fragments/',
  },
];

/**
 * Translate a CF DAM path to its published, servable public path.
 * Non-DAM paths (already-public paths) are returned unchanged.
 * @param {string} path
 * @returns {string}
 */
export function toPublicPath(path) {
  const match = CF_PATH_MAP.find((m) => path.startsWith(m.damPrefix));
  if (match) return path.replace(match.damPrefix, match.publicPrefix);
  return path;
}

/**
 * Fetch a Content Fragment's published HTML and return its body nodes.
 * Rebases relative media URLs against the CF path so images resolve.
 * @param {string} path CF path (with or without extension)
 * @returns {DocumentFragment|null}
 */
export async function loadContentFragment(path) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
  const clean = toPublicPath(path).replace(/(\.plain)?\.html$/, '');
  let resp;
  try {
    resp = await fetch(`${clean}.plain.html`);
  } catch (e) {
    return null;
  }
  if (!resp.ok) return null;

  const tpl = document.createElement('template');
  tpl.innerHTML = await resp.text();

  // rebase relative media refs to the CF's own base path
  const rebase = (tag, attr) => {
    tpl.content.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((el) => {
      el.setAttribute(attr, new URL(el.getAttribute(attr), new URL(clean, window.location)).href);
    });
  };
  rebase('img', 'src');
  rebase('source', 'srcset');

  return tpl.content;
}

// In Universal Editor the block carries data-aue-* instrumentation. A newly
// added block has no reference yet, so we must NOT remove it (the author would
// never be able to select and configure it) — we show a placeholder instead.
const isAuthoring = (block) => !!block.closest('[data-aue-resource]')
  || !!document.querySelector('[data-aue-resource]');

// Clear the scroll-reveal hidden state so the block/section can't get stuck
// invisible in the editor, where the IntersectionObserver may never fire.
// initK811 arms the reveal on the NEXT frame, so we also clear it then.
function forceVisible(block) {
  const clear = () => {
    block.classList.remove('k811-aos-ready');
    const section = block.closest('.section');
    if (section) {
      section.classList.remove('k811-aos-ready');
      section.classList.add('k811-aos-in');
    }
  };
  clear();
  requestAnimationFrame(clear);
}

export default async function decorate(block) {
  initK811(block);

  const editing = isAuthoring(block);

  const link = block.querySelector('a');
  const path = link
    ? link.getAttribute('href')
    : (block.textContent || '').trim();

  const content = path ? await loadContentFragment(path) : null;

  if (!content || !content.childNodes.length) {
    if (editing) {
      const placeholder = document.createElement('div');
      placeholder.className = 'k811-cf-placeholder';
      placeholder.textContent = 'Select a Content Fragment to display.';
      block.replaceChildren(placeholder);
      forceVisible(block);
    } else {
      block.replaceChildren();
    }
    return;
  }

  const inner = document.createElement('div');
  inner.className = 'k811-cf-content';
  inner.append(content);

  block.replaceChildren(inner);

  // Only arm the scroll reveal on the live site; in the editor keep it visible.
  if (editing) forceVisible(block);
  else revealOnScroll(block);
}
