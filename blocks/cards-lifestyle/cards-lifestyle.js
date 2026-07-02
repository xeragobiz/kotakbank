import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards Lifestyle — "A Credit Card for every need".
 * Heading + sub-heading, a row of filter tabs, and a filterable card grid.
 * Each card carries comma-separated tags; clicking a tab shows only matching
 * cards ("All" shows everything). Item cells (grouped): image, content group
 * (name/badge/fees/features/tags), apply link.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const itemRows = rows.filter((r) => r.querySelector('picture'));
  const chromeRows = rows.filter((r) => !r.querySelector('picture'));

  // chrome: heading, sub-heading, filter list (plain text rows, in order)
  const texts = chromeRows
    .map((r) => (r.querySelector(':scope > div') || r).textContent.trim())
    .filter(Boolean);
  const [heading, subtitle, filtersRaw] = texts;
  const filters = (filtersRaw || 'All')
    .split(',').map((t) => t.trim()).filter(Boolean);

  const wrapper = document.createElement('div');
  wrapper.className = 'cards-lifestyle-inner';

  if (heading) {
    const h = document.createElement('h2');
    h.className = 'cards-lifestyle-title';
    h.textContent = heading;
    wrapper.append(h);
  }
  if (subtitle) {
    const p = document.createElement('p');
    p.className = 'cards-lifestyle-subtitle';
    p.textContent = subtitle;
    wrapper.append(p);
  }

  // filter tabs
  const tabs = document.createElement('div');
  tabs.className = 'cards-lifestyle-tabs';
  tabs.setAttribute('role', 'tablist');
  filters.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cards-lifestyle-tab';
    btn.textContent = label;
    btn.dataset.filter = label.toLowerCase();
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tabs.append(btn);
  });
  wrapper.append(tabs);

  // card grid
  const list = document.createElement('ul');
  list.className = 'cards-lifestyle-list';

  itemRows.forEach((row) => {
    const cells = [...row.children].map((c) => c.querySelector(':scope > div') || c);
    const imageCell = cells.find((c) => c.querySelector('picture'));
    const linkCell = cells.find((c) => c.querySelector('a'));
    const contentCell = cells.find((c) => c !== imageCell && c !== linkCell);

    const li = document.createElement('li');
    li.className = 'cards-lifestyle-item';

    // image
    const imgWrap = document.createElement('div');
    imgWrap.className = 'cards-lifestyle-item-image';
    const pic = imageCell ? imageCell.querySelector('picture') : null;
    if (pic) {
      const img = pic.querySelector('img');
      const opt = createOptimizedPicture(img.src, img.getAttribute('alt') || '', false, [{ width: '400' }]);
      imgWrap.append(opt);
    }
    li.append(imgWrap);

    const body = document.createElement('div');
    body.className = 'cards-lifestyle-item-body';

    if (contentCell) {
      const paras = [...contentCell.querySelectorAll(':scope > p')];
      const featureList = contentCell.querySelector('ul, ol');
      // paragraphs in order: name, badge, fees, tags (tags last, hidden)
      const [name, badge, fees, tagsText] = paras.map((p) => p.textContent.trim());

      if (badge) {
        const b = document.createElement('span');
        b.className = 'cards-lifestyle-item-badge';
        b.textContent = badge;
        body.append(b);
      }
      if (name) {
        const h3 = document.createElement('h3');
        h3.className = 'cards-lifestyle-item-title';
        h3.textContent = name;
        body.append(h3);
      }
      if (fees) {
        const f = document.createElement('p');
        f.className = 'cards-lifestyle-item-fees';
        f.textContent = fees;
        body.append(f);
      }
      if (featureList) {
        featureList.classList.add('cards-lifestyle-item-features');
        body.append(featureList);
      }
      // apply tags to the li for filtering
      if (tagsText) {
        li.dataset.tags = tagsText.toLowerCase();
      }
    }

    // apply button
    const link = linkCell ? linkCell.querySelector('a') : null;
    if (link) {
      const actions = document.createElement('div');
      actions.className = 'cards-lifestyle-item-actions';
      link.className = 'cards-lifestyle-apply';
      actions.append(link);
      body.append(actions);
    }

    li.append(body);
    list.append(li);
  });
  wrapper.append(list);

  // filtering behaviour
  const applyFilter = (filter) => {
    list.querySelectorAll(':scope > li').forEach((li) => {
      const tags = li.dataset.tags || '';
      const show = filter === 'all' || tags.split(',').map((t) => t.trim()).includes(filter);
      li.hidden = !show;
    });
  };
  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.cards-lifestyle-tab');
    if (!btn) return;
    tabs.querySelectorAll('.cards-lifestyle-tab').forEach((b) => b.setAttribute('aria-selected', 'false'));
    btn.setAttribute('aria-selected', 'true');
    applyFilter(btn.dataset.filter);
  });

  block.textContent = '';
  block.append(wrapper);
}
