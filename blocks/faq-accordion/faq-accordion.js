import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * FAQ Accordion — "Frequently Asked Questions".
 * Heading + a list of expandable question/answer rows built on semantic
 * <details>/<summary> so it works without JS. The first item is open by
 * default; opening one closes the others (single-open behaviour).
 * Container + repeatable FAQ items.
 *
 * Rows are classified by CELL COUNT: the container heading is a single-cell
 * row, each FAQ Item is a multi-cell row. Each <details> keeps the source
 * row's data-aue-* via moveInstrumentation so items stay visible/editable in
 * Universal Editor even before question/answer are filled.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  let heading = '';
  const items = [];
  rows.forEach((r) => {
    const cells = [...r.children].map((c) => c.querySelector(':scope > div') || c);
    if (cells.length <= 1) {
      const t = (cells[0] || r).textContent.trim();
      if (t) heading = t;
      return;
    }
    const question = cells[0].textContent.trim();
    const answerCell = cells[1];
    items.push({ row: r, question, answerCell });
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'faq-accordion-inner';

  if (heading) {
    const h = document.createElement('h2');
    h.className = 'faq-accordion-title';
    h.textContent = heading;
    wrapper.append(h);
  }

  const listEl = document.createElement('div');
  listEl.className = 'faq-accordion-list';

  items.forEach((it, i) => {
    const details = document.createElement('details');
    details.className = 'faq-accordion-item';
    details.name = 'faq-accordion';
    if (i === 0) details.open = true;
    // preserve the child component's instrumentation so it stays editable
    moveInstrumentation(it.row, details);

    const summary = document.createElement('summary');
    summary.className = 'faq-accordion-question';
    const label = document.createElement('span');
    label.textContent = it.question;
    const icon = document.createElement('span');
    icon.className = 'faq-accordion-icon';
    icon.setAttribute('aria-hidden', 'true');
    summary.append(label, icon);
    details.append(summary);

    const answer = document.createElement('div');
    answer.className = 'faq-accordion-answer';
    if (it.answerCell) {
      [...it.answerCell.childNodes].forEach((n) => answer.append(n.cloneNode(true)));
    }
    details.append(answer);

    listEl.append(details);
  });

  wrapper.append(listEl);

  // single-open behaviour fallback for browsers without <details name=...>
  const supportsName = 'name' in document.createElement('details');
  if (!supportsName) {
    listEl.addEventListener('toggle', (e) => {
      const d = e.target;
      if (d.open) {
        listEl.querySelectorAll('details[open]').forEach((other) => {
          if (other !== d) other.open = false;
        });
      }
    }, true);
  }

  block.textContent = '';
  block.append(wrapper);
}
