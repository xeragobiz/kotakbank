import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * K811 Team — "The Essentials" static grid of member cards.
 * Content model: optional leading title row, then one row per member with
 * cells: photo (<picture>), name, LinkedIn link.
 */
export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];

  const nodes = [];
  const memberRows = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 1 && cells[0].querySelector('h1, h2, h3')
      && !cells[0].querySelector('picture')) {
      const h = document.createElement('h2');
      h.className = 'k811-team-title';
      h.textContent = cells[0].textContent.trim();
      nodes.push(h);
    } else {
      memberRows.push(row);
    }
  });

  const grid = document.createElement('div');
  grid.className = 'k811-team-grid';

  memberRows.forEach((row) => {
    const cells = [...row.children];
    const picture = row.querySelector('picture');
    const link = row.querySelector('a');
    const name = cells.map((c) => c.textContent.trim())
      .find((t) => t && !/^https?:/.test(t)) || '';

    const card = document.createElement('div');
    card.className = 'k811-team-card';

    if (picture) {
      const img = picture.querySelector('img');
      const photo = document.createElement('div');
      photo.className = 'k811-team-photo';
      photo.append(img ? createOptimizedPicture(img.src, name, false, [{ width: '600' }]) : picture);
      card.append(photo);
    }

    const meta = document.createElement('div');
    meta.className = 'k811-team-meta';
    if (name) {
      const h = document.createElement('h4');
      h.className = 'k811-team-name';
      h.textContent = name;
      meta.append(h);
    }
    if (link) {
      link.classList.add('k811-team-linkedin');
      link.setAttribute('aria-label', `${name} on LinkedIn`);
      link.textContent = '';
      meta.append(link);
    }
    card.append(meta);
    grid.append(card);
  });

  nodes.push(grid);
  block.replaceChildren(...nodes);
  revealOnScroll(block);
}
