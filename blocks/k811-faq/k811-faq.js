import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * K811 FAQ — accordion built on native <details>/<summary> (accessible, no JS
 * needed to toggle). Optional leading title/subtitle rows, then one row per
 * Q&A pair: cell 1 = question, cell 2 = answer. If a row has a single cell,
 * odd rows are treated as questions and even rows as answers.
 */
export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];

  const nodes = [];
  const items = [];

  rows.forEach((row) => {
    const cs = [...row.children];
    if (cs.length >= 2) {
      // question | answer
      items.push({ q: cs[0], a: cs[1] });
    } else {
      const only = cs[0] || row;
      const isHeading = only.querySelector('h1, h2, h3, h4');
      if (isHeading && items.length === 0) {
        // leading title / subtitle
        const h = document.createElement(only.querySelector('h1, h2, h3, h4').tagName.toLowerCase() === 'h1' ? 'h2' : 'h3');
        h.className = 'k811-faq-title';
        h.textContent = only.textContent.trim();
        nodes.push(h);
      } else {
        // single-cell Q then A alternating
        const pending = items[items.length - 1];
        if (pending && !pending.a) pending.a = only;
        else items.push({ q: only, a: null });
      }
    }
  });

  const list = document.createElement('div');
  list.className = 'k811-faq-list';
  items.forEach(({ q, a }, i) => {
    const details = document.createElement('details');
    details.className = 'k811-faq-item';
    // First question expanded by default, matching the live page.
    if (i === 0) details.open = true;
    const summary = document.createElement('summary');
    summary.className = 'k811-faq-q';
    // textContent (not innerHTML) so authored question text can't inject HTML
    const qSpan = document.createElement('span');
    qSpan.textContent = q.textContent.trim();
    summary.append(qSpan);
    const answer = document.createElement('div');
    answer.className = 'k811-faq-a';
    if (a) while (a.firstChild) answer.append(a.firstChild);
    details.append(summary, answer);
    list.append(details);
  });
  nodes.push(list);

  block.replaceChildren(...nodes);
  revealOnScroll(block);
}
