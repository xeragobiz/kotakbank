import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * K811 Card Selector — "Choose Your Metal" click-to-swap variant selector.
 *
 * Content model: optional leading single-cell title row, then one row per
 * variant. The cells are matched by CONTENT, not fixed position, because the
 * xwalk block renderer may drop or reorder the plain-text "variant name" cell:
 *   - variant name  — a text-only cell (no picture/link); if absent we fall
 *                     back to the card image's alt text, then its filename.
 *   - card image    — the cell containing a <picture>/<img>.
 *   - fees panel    — the cell with the "Fees & eligibility" rich text.
 *   - Apply CTA / T&C — link cells (Apply = first .../mdc link, T&C = the other).
 *
 * Interaction: a left-hand list of variant names; clicking one swaps the
 * displayed card image and the fees panel (custom, no library — mirrors the
 * source's React state toggle). First variant active by default.
 */

// Derive a human name from an image when the name cell was dropped: prefer the
// alt text, else prettify the (possibly hash-suffixed) filename.
function nameFromImage(picture) {
  const img = picture && picture.querySelector('img');
  const alt = img && img.getAttribute('alt');
  if (alt && alt.trim()) return alt.trim();
  const src = (img && (img.getAttribute('src') || '')) || '';
  const file = src.split('/').pop() || '';
  const base = file.replace(/\.[a-z0-9]+(\?.*)?$/i, '') // drop extension + query
    .replace(/_[a-f0-9]{6,}$/i, '') // drop trailing content hash
    .replace(/[_-]+/g, ' ') // separators -> spaces
    .trim();
  return base ? base.replace(/\b\w/g, (c) => c.toUpperCase()) : '';
}
// Metal swatch gradients, matched to the source site (linear-gradient 0deg).
const SWATCH_GRADIENTS = {
  gold: 'linear-gradient(0deg, #dda94a, #f6e085 46.63%, #dda94a)',
  'rose gold': 'linear-gradient(0deg, #e77d5d, #fec5b5 46.63%, #e77d5d)',
  'midnight black': 'linear-gradient(0deg, #282828, #676666 46.63%, #343434)',
  'crimson red': 'linear-gradient(0deg, #ff1313, #ff7272 46.63%, #ff1313)',
  silver: 'linear-gradient(0deg, #d0d0d2, #fff 46.63%, #d0d0d2)',
};

function swatchGradient(name) {
  return SWATCH_GRADIENTS[name.trim().toLowerCase()] || '#999';
}

export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];

  let titleText = '';
  const variants = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    const isHeadingCell = (el) => el && (el.matches('h1, h2, h3')
      || (el.querySelector && el.querySelector('h1, h2, h3')));
    if (cells.length === 1 && isHeadingCell(cells[0])
      && !cells[0].querySelector?.('picture')) {
      titleText = cells[0].textContent.trim();
      return;
    }

    // Match cells by content, not position (the name cell may be dropped).
    const picCell = cells.find((c) => c.querySelector('picture, img'));
    const picture = picCell ? picCell.querySelector('picture') || picCell.querySelector('img') : null;
    // Panel = the cell that holds the fees rich text (a heading/paragraph but
    // no picture and not purely a link).
    const panelCell = cells.find((c) => c !== picCell
      && !c.querySelector('picture, img')
      && c.querySelector('h1, h2, h3, h4, p, ul, ol')
      && (c.textContent || '').trim().length > 20);
    // Name = a text-only cell that is neither the picture nor the panel and has
    // no link; fall back to the image alt / filename when it was dropped.
    const nameCell = cells.find((c) => c !== picCell && c !== panelCell
      && !c.querySelector('picture, img, a')
      && (c.textContent || '').trim());
    const name = (nameCell && nameCell.textContent.trim()) || nameFromImage(picture);

    // Identify links by href, not document order: the T&C link lives inside the
    // panel richtext (so it appears first in DOM), while Apply is its own cell.
    const links = [...row.querySelectorAll('a')];
    const tncLink = links.find((a) => /terms-and-conditions|t&c|tnc/i.test(a.getAttribute('href') || ''))
      || links.find((a) => /t&c|terms/i.test(a.textContent || ''));
    const applyLink = links.find((a) => a !== tncLink) || null;
    if (picture || panelCell || name) {
      variants.push({
        name: name || 'Card',
        picture,
        panel: panelCell,
        applyLink,
        tncLink: tncLink || null,
      });
    }
  });

  if (!variants.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'k811-card-selector-wrap';

  if (titleText) {
    const h = document.createElement('h2');
    h.className = 'k811-card-selector-title';
    h.textContent = titleText;
    block.replaceChildren();
    block.append(h, wrap);
  } else {
    block.replaceChildren(wrap);
  }

  // Left column: active variant name + swatch row + fees panel + actions.
  const info = document.createElement('div');
  info.className = 'k811-card-selector-info';

  const activeName = document.createElement('p');
  activeName.className = 'k811-card-selector-name';

  const tabs = document.createElement('div');
  tabs.className = 'k811-card-selector-swatches';
  tabs.setAttribute('role', 'tablist');

  const panel = document.createElement('div');
  panel.className = 'k811-card-selector-panel';

  info.append(activeName, tabs, panel);

  // Right column: fanned card deck. The active card is pulled to the front
  // (full size + brightness); every other card recedes upward, scaled down and
  // darkened — matching the source's translate/scale/brightness model.
  const media = document.createElement('div');
  media.className = 'k811-card-selector-media';

  const stage = document.createElement('div');
  stage.className = 'k811-card-selector-stage';
  stage.append(info, media);

  const panels = [];
  const mediaEls = [];
  const activators = [];
  const n = variants.length;

  // Fan geometry (percentages/scale per depth step), tuned to the live deck:
  // depth 0 = active card in front; deeper cards peek only slightly above it,
  // barely shrinking — a tight stack, not a wide fan.
  const BASE_Y = 10; // active card's upward shift (% of its own height)
  const STEP_Y = 8; // extra upward shift per depth step (visible peek)
  const STEP_SCALE = 0.05; // shrink per depth step
  const applyFan = (activeIdx) => {
    mediaEls.forEach((el, idx) => {
      const depth = (idx - activeIdx + n) % n; // 0 = active, then wraps
      el.style.transform = `translate(-50%, -${BASE_Y + depth * STEP_Y}%) scale(${(1 - depth * STEP_SCALE).toFixed(3)})`;
      el.style.filter = depth === 0 ? 'brightness(1)' : 'brightness(0.2)';
      el.style.zIndex = String(n - depth);
    });
  };

  variants.forEach((v, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'k811-card-selector-swatch';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-label', v.name);
    tab.style.backgroundImage = swatchGradient(v.name);

    // media for this variant (stacked, one visible at a time)
    const mediaItem = document.createElement('div');
    mediaItem.className = 'k811-card-selector-card';
    if (v.picture) {
      const img = v.picture.matches?.('img') ? v.picture : v.picture.querySelector('img');
      // Use the raw attribute and reject broken placeholders (e.g. about:error,
      // nullerror) that the authoring pipeline emits for a missing asset.
      const rawSrc = img && (img.getAttribute('src') || '');
      const validSrc = rawSrc && /^(https?:\/\/|\/|\.\/)/.test(rawSrc) && !/^about:/.test(rawSrc);
      if (validSrc) {
        mediaItem.append(createOptimizedPicture(rawSrc, v.name, i === 0, [{ width: '750' }]));
      } else if (img) {
        // keep the original <img>/<picture> so the alt text still conveys the
        // variant, without a doubly-broken optimized <picture>.
        mediaItem.append(v.picture);
      }
    }
    mediaEls.push(mediaItem);
    media.append(mediaItem);

    // panel for this variant
    const panelItem = document.createElement('div');
    panelItem.className = 'k811-card-selector-panel-item';
    if (v.panel) while (v.panel.firstChild) panelItem.append(v.panel.firstChild);
    const actions = document.createElement('div');
    actions.className = 'k811-card-selector-actions';
    if (v.tncLink) {
      v.tncLink.classList.add('k811-card-selector-tnc');
      panelItem.append(v.tncLink);
    }
    if (v.applyLink) {
      v.applyLink.classList.add('k811-card-selector-apply');
      actions.append(v.applyLink);
    }
    if (actions.children.length) panelItem.append(actions);
    panels.push(panelItem);
    panel.append(panelItem);

    const activate = () => {
      tabs.querySelectorAll('.k811-card-selector-swatch').forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      mediaEls.forEach((m) => m.classList.remove('is-active'));
      panels.forEach((p) => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      mediaItem.classList.add('is-active');
      panelItem.classList.add('is-active');
      activeName.textContent = v.name;
      applyFan(i);
    };
    tab.addEventListener('click', activate);
    activators.push(activate);

    tabs.append(tab);
  });

  // Activate the first variant only AFTER all cards exist, so the fan geometry
  // is computed against the full deck (not a partially-built one).
  if (activators.length) activators[0]();

  wrap.append(stage);
  revealOnScroll(block);
}
