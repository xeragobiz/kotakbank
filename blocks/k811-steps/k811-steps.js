import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * K811 Steps — "How To Apply" numbered steps with a trailing CTA.
 *
 * Content model: an optional leading single-cell "title" row, then one row per
 * step (each a single rich cell of text), and optional trailing CTA link rows.
 * Steps are auto-numbered 1..N. Reveals with the shared AOS fade-in.
 */
export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r);

  const titleRow = cells.find((c) => c.querySelector('h1, h2, h3')
    && !c.querySelector('a'));
  const linkRows = cells.filter((c) => c !== titleRow && c.querySelector('a'));
  const stepRows = cells.filter((c) => c !== titleRow && !linkRows.includes(c)
    && (c.textContent || '').trim());

  const nodes = [];
  if (titleRow) {
    const h = document.createElement('h2');
    h.className = 'k811-steps-title';
    h.textContent = titleRow.textContent.trim();
    nodes.push(h);
  }

  const list = document.createElement('ol');
  list.className = 'k811-steps-list';
  stepRows.forEach((c) => {
    const li = document.createElement('li');
    li.className = 'k811-steps-item';
    const body = document.createElement('div');
    body.className = 'k811-steps-body';
    while (c.firstChild) body.append(c.firstChild);
    li.append(body);
    list.append(li);
  });
  nodes.push(list);

  if (linkRows.length) {
    const actions = document.createElement('div');
    actions.className = 'k811-steps-actions';
    // Secondary links (with their "Existing customer?" label) share one line in
    // a note row BELOW the primary button, matching the live layout.
    const note = document.createElement('div');
    note.className = 'k811-steps-actions-note';
    linkRows.forEach((c, i) => {
      const link = c.querySelector('a');
      if (!link) return;
      link.classList.add('k811-steps-btn');
      link.classList.add(i === 0 ? 'k811-steps-btn-primary' : 'k811-steps-btn-secondary');
      const label = (c.textContent || '').replace(link.textContent.trim(), '').trim();
      if (i === 0) {
        actions.append(link);
      } else {
        if (label) {
          const span = document.createElement('span');
          span.className = 'k811-steps-actions-label';
          span.textContent = label;
          note.append(span);
        }
        note.append(link);
      }
    });
    if (note.childElementCount) actions.append(note);
    nodes.push(actions);
  }

  block.replaceChildren(...nodes);
  revealOnScroll(block);
}
