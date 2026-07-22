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

  // Tabs (variant names)
  const tabs = document.createElement('div');
  tabs.className = 'k811-card-selector-tabs';
  tabs.setAttribute('role', 'tablist');

  // Stage: card image + fees panel
  const stage = document.createElement('div');
  stage.className = 'k811-card-selector-stage';
  const media = document.createElement('div');
  media.className = 'k811-card-selector-media';
  const panel = document.createElement('div');
  panel.className = 'k811-card-selector-panel';
  stage.append(media, panel);

  const panels = [];
  const mediaEls = [];

  variants.forEach((v, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'k811-card-selector-tab';
    tab.setAttribute('role', 'tab');
    tab.textContent = v.name;

    // media for this variant
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
    if (v.applyLink) {
      v.applyLink.classList.add('k811-card-selector-apply');
      actions.append(v.applyLink);
    }
    if (v.tncLink) {
      v.tncLink.classList.add('k811-card-selector-tnc');
      actions.append(v.tncLink);
    }
    if (actions.children.length) panelItem.append(actions);
    panels.push(panelItem);
    panel.append(panelItem);

    const activate = () => {
      tabs.querySelectorAll('.k811-card-selector-tab').forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      mediaEls.forEach((m) => m.classList.remove('is-active'));
      panels.forEach((p) => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      mediaItem.classList.add('is-active');
      panelItem.classList.add('is-active');
    };
    tab.addEventListener('click', activate);
    if (i === 0) activate();

    tabs.append(tab);
  });

  wrap.append(tabs, stage);
  revealOnScroll(block);
}
