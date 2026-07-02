import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards Featured — "Popular Kotak Credit Cards".
 * Section header (eyebrow/heading/description + view-all) and a grid of
 * featured card tiles. Item cells (grouped/collapsed to 4):
 *   1) image, 2) content group (highlight, sub, name, features),
 *   3) compare link, 4) apply link.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const itemRows = rows.filter((r) => r.querySelector('picture'));
  const chromeRows = rows.filter((r) => !r.querySelector('picture'));

  // header chrome: eyebrow, heading, description (text) + bottom CTA link
  const texts = [];
  let ctaHref = '';
  let ctaText = '';
  chromeRows.forEach((r) => {
    const cell = r.querySelector(':scope > div') || r;
    const link = cell.querySelector('a');
    const txt = cell.textContent.trim();
    if (link) {
      ctaHref = link.getAttribute('href');
      if (link.textContent.trim()) ctaText = link.textContent.trim();
    } else if (txt) {
      texts.push(txt);
    }
  });
  const [eyebrow, heading, description] = texts;

  const wrapper = document.createElement('div');
  wrapper.className = 'cards-featured-inner';

  const header = document.createElement('div');
  header.className = 'cards-featured-header';
  if (eyebrow) {
    const e = document.createElement('p');
    e.className = 'cards-featured-eyebrow';
    e.textContent = eyebrow;
    header.append(e);
  }
  if (heading) {
    const h = document.createElement('h2');
    h.className = 'cards-featured-title';
    h.textContent = heading;
    header.append(h);
  }
  if (description) {
    const p = document.createElement('p');
    p.className = 'cards-featured-desc';
    p.textContent = description;
    header.append(p);
  }
  wrapper.append(header);

  const list = document.createElement('ul');
  list.className = 'cards-featured-list';

  itemRows.forEach((row) => {
    const cells = [...row.children].map((c) => c.querySelector(':scope > div') || c);
    const imageCell = cells.find((c) => c.querySelector('picture'));
    const linkCells = cells.filter((c) => c.querySelector('a'));
    // content group = remaining non-image, non-link cell
    const contentCell = cells.find((c) => c !== imageCell && !c.querySelector('a'));

    const li = document.createElement('li');
    li.className = 'cards-featured-item';

    // image
    const imgWrap = document.createElement('div');
    imgWrap.className = 'cards-featured-item-image';
    const pic = imageCell ? imageCell.querySelector('picture') : null;
    if (pic) {
      const img = pic.querySelector('img');
      const opt = createOptimizedPicture(img.src, img.getAttribute('alt') || '', false, [{ width: '500' }]);
      imgWrap.append(opt);
    }
    li.append(imgWrap);

    // parse the content group: leading paragraphs are highlight/sub/name;
    // a nested list (or remaining paragraphs) are the features/fees.
    if (contentCell) {
      const paras = [...contentCell.querySelectorAll(':scope > p')];
      const featureList = contentCell.querySelector('ul, ol');
      const [highlight, highlightSub, name] = paras.map((p) => p.textContent.trim());

      if (highlight) {
        const hl = document.createElement('div');
        hl.className = 'cards-featured-item-highlight';
        const main = document.createElement('span');
        main.className = 'cards-featured-item-highlight-main';
        main.textContent = highlight;
        hl.append(main);
        if (highlightSub) {
          const sub = document.createElement('span');
          sub.className = 'cards-featured-item-highlight-sub';
          sub.textContent = highlightSub;
          hl.append(sub);
        }
        li.append(hl);
      }

      const body = document.createElement('div');
      body.className = 'cards-featured-item-body';
      if (name) {
        const h3 = document.createElement('h3');
        h3.className = 'cards-featured-item-title';
        h3.textContent = name;
        body.append(h3);
      }
      if (featureList) {
        const feat = document.createElement('div');
        feat.className = 'cards-featured-item-features';
        feat.append(featureList);
        body.append(feat);
      }

      // actions: first link = compare, second = apply
      const actions = document.createElement('div');
      actions.className = 'cards-featured-item-actions';
      linkCells.forEach((c, i) => {
        const link = c.querySelector('a');
        if (!link) return;
        link.className = i === 0 ? 'cards-featured-compare' : 'cards-featured-apply';
        actions.append(link);
      });
      if (actions.children.length) body.append(actions);

      li.append(body);
    }

    list.append(li);
  });
  wrapper.append(list);

  if (ctaHref && ctaText) {
    const foot = document.createElement('div');
    foot.className = 'cards-featured-footer';
    const a = document.createElement('a');
    a.href = ctaHref;
    a.className = 'cards-featured-explore';
    a.textContent = ctaText;
    foot.append(a);
    wrapper.append(foot);
  }

  block.textContent = '';
  block.append(wrapper);
}
