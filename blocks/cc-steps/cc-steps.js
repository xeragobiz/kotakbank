import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * CC Steps — "Apply online in 3 simple steps".
 * Heading + sub-heading + a row of step cards (icon + title + description)
 * and a CTA button.
 *
 * Row classification is by CELL COUNT, not by the presence of an icon image:
 * container fields (heading/subtitle/CTA) render as single-cell rows, while
 * each Step item renders as a multi-cell row (icon, title, description). This
 * keeps a Step visible in Universal Editor even before its icon is authored —
 * detecting by <picture> would drop icon-less steps and make them "disappear".
 *
 * Child rows keep their data-aue-* instrumentation via moveInstrumentation so
 * they remain editable in Universal Editor.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const itemRows = rows.filter((r) => r.children.length > 1);
  const chromeRows = rows.filter((r) => r.children.length <= 1);

  // chrome: heading, sub-heading, then the CTA (a link) + its label
  let heading = '';
  let subtitle = '';
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
      if (!heading) heading = txt;
      else if (!subtitle) subtitle = txt;
      else if (!ctaText) ctaText = txt;
    }
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'cc-steps-inner';

  if (heading) {
    const h = document.createElement('h2');
    h.className = 'cc-steps-title';
    h.textContent = heading;
    wrapper.append(h);
  }
  if (subtitle) {
    const p = document.createElement('p');
    p.className = 'cc-steps-subtitle';
    p.textContent = subtitle;
    wrapper.append(p);
  }

  const list = document.createElement('ul');
  list.className = 'cc-steps-list';
  itemRows.forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cc-steps-item';
    // preserve instrumentation and MOVE the authored cells into the <li>
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    // classify the moved cells: icon (picture) vs title vs description
    [...li.children].forEach((cell) => {
      if (cell.querySelector('picture')) {
        cell.className = 'cc-steps-icon';
      } else if (cell.querySelector('p, ul, ol')) {
        cell.className = 'cc-steps-item-desc';
      } else if (cell.textContent.trim()) {
        cell.className = 'cc-steps-item-title';
      } else {
        // empty cell (e.g. icon not yet authored) — keep as the icon slot
        cell.className = 'cc-steps-icon';
      }
    });

    list.append(li);
  });
  wrapper.append(list);

  // optimise icon images while preserving their instrumentation
  list.querySelectorAll('picture > img').forEach((img) => {
    const opt = createOptimizedPicture(img.src, img.alt, false, [{ width: '80' }]);
    moveInstrumentation(img, opt.querySelector('img'));
    img.closest('picture').replaceWith(opt);
  });

  if (ctaHref && ctaText) {
    const actions = document.createElement('div');
    actions.className = 'cc-steps-actions';
    const a = document.createElement('a');
    a.href = ctaHref;
    a.className = 'cc-steps-btn';
    a.textContent = ctaText;
    // Check Eligibility opens the quick-check modal instead of navigating
    a.addEventListener('click', (e) => {
      e.preventDefault();
      // eslint-disable-next-line no-use-before-define
      openEligibilityModal(ctaHref);
    });
    actions.append(a);
    wrapper.append(actions);
  }

  block.textContent = '';
  block.append(wrapper);
}

/* eligibility quick-check: 4 questions + result, shown in a modal */
const ELIGIBILITY_QUESTIONS = [
  { q: "What's your age?", options: ['18-25 years', '26-40 years', '41-60 years', '60+ years'] },
  { q: "What's your monthly income?", options: ['Below 15000', '30000-45000', '45000-75000', 'Above 75000'] },
  { q: 'Employment status?', options: ['Salaried', 'Self-Employed', 'Business Owner', 'Student/other'] },
  { q: 'Do you have an existing credit card?', options: ['Yes, from any bank', 'No, first time', 'Had one before', 'Multiple cards'] },
];

function openEligibilityModal(applyHref) {
  const total = ELIGIBILITY_QUESTIONS.length;
  let step = 0;

  const overlay = document.createElement('div');
  overlay.className = 'cc-steps-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Check your eligibility');

  const modal = document.createElement('div');
  modal.className = 'cc-steps-modal';

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
  };

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'cc-steps-modal-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', close);

  const head = document.createElement('div');
  head.className = 'cc-steps-modal-head';
  head.innerHTML = `
    <p class="cc-steps-modal-eyebrow">Quick Check</p>
    <h3 class="cc-steps-modal-title">Check your eligibility in 30 seconds</h3>
    <p class="cc-steps-modal-sub">Answer 4 quick questions to know if you qualify</p>`;

  const bodyEl = document.createElement('div');
  bodyEl.className = 'cc-steps-modal-body';

  const renderQuestion = () => {
    // header (Quick Check / title / subtitle) shows only on the first question
    head.hidden = step > 0;
    const { q, options } = ELIGIBILITY_QUESTIONS[step];
    // progress reflects answered questions: 0% on the first question, then
    // 25% after answering it, and so on up to 100% at the result.
    const pct = Math.round((step / total) * 100);
    bodyEl.innerHTML = `
      <div class="cc-steps-quiz-progress">
        <div class="cc-steps-quiz-progress-row">
          <span class="cc-steps-quiz-count">Question ${step + 1} of ${total}</span>
          <span class="cc-steps-quiz-pct">${pct}%</span>
        </div>
        <div class="cc-steps-quiz-bar"><span style="width:${pct}%"></span></div>
      </div>
      <h4 class="cc-steps-quiz-question">${q}</h4>
      <div class="cc-steps-quiz-options"></div>`;
    const optionsWrap = bodyEl.querySelector('.cc-steps-quiz-options');
    options.forEach((label) => {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'cc-steps-quiz-option';
      opt.textContent = label;
      opt.addEventListener('click', () => {
        step += 1;
        // eslint-disable-next-line no-use-before-define
        if (step >= total) renderResult(); else renderQuestion();
      });
      optionsWrap.append(opt);
    });
  };

  function renderResult() {
    head.hidden = true;
    bodyEl.innerHTML = `
      <div class="cc-steps-quiz-result">
        <span class="cc-steps-quiz-result-icon" aria-hidden="true"></span>
        <h4 class="cc-steps-quiz-result-title">Great news! You're likely eligible</h4>
        <p class="cc-steps-quiz-result-note">Based on your profile, you meet the basic criteria for most Kotak credit cards. Apply now to get instant approval.</p>
        <div class="cc-steps-quiz-result-actions">
          <a class="cc-steps-quiz-apply" href="${applyHref || '#'}">Apply Now</a>
          <button type="button" class="cc-steps-quiz-again">Check again</button>
        </div>
      </div>`;
    bodyEl.querySelector('.cc-steps-quiz-again').addEventListener('click', () => {
      step = 0;
      renderQuestion();
    });
  }

  renderQuestion();

  modal.append(closeBtn, head, bodyEl);
  overlay.append(modal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });
  document.body.append(overlay);
  document.body.style.overflow = 'hidden';
}
