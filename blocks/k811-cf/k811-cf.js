import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * K811 CF — renders an AEM Content Fragment referenced by path.
 *
 * In the modern EDS model, a published Content Fragment is delivered as its own
 * self-contained semantic HTML page (via the json2html overlay). This block
 * takes a CF *reference* (a path chosen in Universal Editor, or a plain path in
 * the block cell) and inlines that CF's published HTML into the page — the same
 * fetch-and-inline approach the platform `fragment` block uses for page
 * fragments, but scoped and styled for kotak811 CF content.
 *
 * Content contract (rows in model order):
 *   1. reference — the Content Fragment (aem-content reference → <a href>, or a
 *                  cell whose text is the CF path)
 *
 * If the reference can't be loaded, the block removes itself rather than leaving
 * broken markup on the page.
 */

/**
 * Fetch a Content Fragment's published HTML and return its body nodes.
 * Rebases relative media URLs against the CF path so images resolve.
 * @param {string} path CF path (with or without extension)
 * @returns {DocumentFragment|null}
 */
export async function loadContentFragment(path) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
  const clean = path.replace(/(\.plain)?\.html$/, '');
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

export default async function decorate(block) {
  initK811(block);

  const link = block.querySelector('a');
  const path = link
    ? link.getAttribute('href')
    : (block.textContent || '').trim();

  const content = await loadContentFragment(path);

  if (!content || !content.childNodes.length) {
    block.remove();
    return;
  }

  const inner = document.createElement('div');
  inner.className = 'k811-cf-content';
  inner.append(content);

  block.replaceChildren(inner);
  revealOnScroll(block);
}
