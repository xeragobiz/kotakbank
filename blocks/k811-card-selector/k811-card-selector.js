import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * K811 Card Selector — "Choose Your Metal" click-to-swap variant selector.
 *
 * Content model: optional leading single-cell title row, then one row per
 * variant with cells (in order):
 *   1. name (e.g. "Gold")
 *   2. card image (<picture>)
 *   3. fees & eligibility rich text (issuance fee, best value, deposit, etc.)
 *   4. (optional) Apply CTA link
 *   5. (optional) T&C link
 *
 * Interaction: a left-hand list of variant names; clicking one swaps the
 * displayed card image and the fees panel (custom, no library — mirrors the
 * source's React state toggle). First variant active by default.
 */
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
    const name = (cells[0]?.textContent || '').trim();
    const picture = cells[1]?.querySelector('picture') || cells.find((c) => c.querySelector('picture'))?.querySelector('picture');
    const panelCell = cells[2] || null;
    const links = row.querySelectorAll('a');
    if (name) {
      variants.push({
        name,
        picture,
        panel: panelCell,
        applyLink: links[0] || null,
        tncLink: links[1] || null,
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

  // Right column: layered card deck (all cards stacked; active on top).
  const media = document.createElement('div');
  media.className = 'k811-card-selector-media';

  const stage = document.createElement('div');
  stage.className = 'k811-card-selector-stage';
  stage.append(info, media);

  const panels = [];
  const mediaEls = [];

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
      const img = v.picture.querySelector('img');
      if (img) {
        mediaItem.append(createOptimizedPicture(img.src, v.name, i === 0, [{ width: '750' }]));
      } else {
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
    };
    tab.addEventListener('click', activate);
    if (i === 0) activate();

    tabs.append(tab);
  });

  wrap.append(stage);
  revealOnScroll(block);
}
