import openEligibilityModal from '../../scripts/eligibility-modal.js';

const APPLY_PAGE = '/apply';

/*
 * Sticky CTA — a bar pinned to the bottom of the viewport with a short message
 * and a primary action (e.g. "Check Eligibility"). Dismissible.
 *
 * Authored cells, in order:
 *   1. Message (rich text, e.g. "Your Kotak Cashback+ card awaits you!")
 *   2. CTA link
 */
export default function decorate(block) {
  const cells = [...block.children].map((r) => r.querySelector(':scope > div') || r);
  const linkCell = cells.find((c) => c.querySelector('a'));
  const textCell = cells.find((c) => c !== linkCell && c.textContent.trim());

  const bar = document.createElement('div');
  bar.className = 'sticky-cta-bar';

  const msg = document.createElement('div');
  msg.className = 'sticky-cta-message';
  if (textCell) {
    while (textCell.firstChild) msg.append(textCell.firstChild);
  }
  bar.append(msg);

  const link = linkCell ? linkCell.querySelector('a') : null;
  if (link) {
    link.classList.add('sticky-cta-action');
    // a "Check Eligibility" action opens the quick-check modal instead of navigating
    if (/eligibility/i.test(link.textContent)) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openEligibilityModal(APPLY_PAGE);
      });
    }
    bar.append(link);
  }

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'sticky-cta-close';
  close.setAttribute('aria-label', 'Dismiss');
  close.textContent = '×';
  close.addEventListener('click', () => { block.hidden = true; });
  bar.append(close);

  block.textContent = '';
  block.append(bar);
}
