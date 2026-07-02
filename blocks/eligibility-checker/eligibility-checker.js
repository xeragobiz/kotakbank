/**
 * Eligibility Checker — a short multi-question quiz with a progress bar.
 * Renders one question at a time; selecting an answer advances to the next.
 * After the last question it shows an authorable result panel with a CTA.
 * Quiz navigation/progress is hardcoded; questions, options, and result copy
 * are authorable. No network calls — client-side only.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // question items = rows whose first cell has a following comma-separated
  // options cell; chrome rows carry the eyebrow/heading/subtitle/result copy.
  const questions = [];
  const chrome = [];
  rows.forEach((r) => {
    const cells = [...r.children].map((c) => c.querySelector(':scope > div') || c);
    // a question row has 2 text cells: question + options (comma list)
    if (cells.length >= 2 && cells[1].textContent.includes(',') && !cells[1].querySelector('a')) {
      questions.push({
        q: cells[0].textContent.trim(),
        options: cells[1].textContent.split(',').map((o) => o.trim()).filter(Boolean),
      });
    } else {
      chrome.push(r);
    }
  });

  // parse chrome: eyebrow, heading, subtitle (plain), result title, result body, cta
  let eyebrow = '';
  let heading = '';
  let subtitle = '';
  let resultTitle = '';
  let resultBody = null;
  let ctaHref = '';
  let ctaText = '';
  const plain = [];
  chrome.forEach((r) => {
    const cell = r.querySelector(':scope > div') || r;
    const link = cell.querySelector('a');
    if (link) {
      ctaHref = link.getAttribute('href');
      if (link.textContent.trim()) ctaText = link.textContent.trim();
      return;
    }
    if (cell.querySelector('p, ul, ol') && cell.querySelectorAll('p, li').length > 0
      && cell.textContent.trim().length > 60) {
      resultBody = cell;
      return;
    }
    const txt = cell.textContent.trim();
    if (txt) plain.push(txt);
  });
  [eyebrow, heading, subtitle, resultTitle] = plain;

  const wrapper = document.createElement('div');
  wrapper.className = 'eligibility-checker-inner';

  const head = document.createElement('div');
  head.className = 'eligibility-checker-head';
  if (eyebrow) {
    const e = document.createElement('p');
    e.className = 'eligibility-checker-eyebrow';
    e.textContent = eyebrow;
    head.append(e);
  }
  if (heading) {
    const h = document.createElement('h2');
    h.className = 'eligibility-checker-title';
    h.textContent = heading;
    head.append(h);
  }
  if (subtitle) {
    const p = document.createElement('p');
    p.className = 'eligibility-checker-subtitle';
    p.textContent = subtitle;
    head.append(p);
  }
  wrapper.append(head);

  const panel = document.createElement('div');
  panel.className = 'eligibility-checker-panel';
  wrapper.append(panel);

  let current = 0;

  // single render function driven by `current`; event handlers set `current`
  // then call render() directly, so there are no forward references.
  function render() {
    panel.innerHTML = '';

    // result state (past the last question)
    if (current >= questions.length) {
      const res = document.createElement('div');
      res.className = 'eligibility-checker-result';
      if (resultTitle) {
        const h3 = document.createElement('h3');
        h3.textContent = resultTitle;
        res.append(h3);
      }
      if (resultBody) {
        const body = document.createElement('div');
        body.className = 'eligibility-checker-result-body';
        [...resultBody.childNodes].forEach((n) => body.append(n.cloneNode(true)));
        res.append(body);
      }
      if (ctaHref && ctaText) {
        const a = document.createElement('a');
        a.href = ctaHref;
        a.className = 'eligibility-checker-cta';
        a.textContent = ctaText;
        res.append(a);
      }
      const restart = document.createElement('button');
      restart.type = 'button';
      restart.className = 'eligibility-checker-restart';
      restart.textContent = 'Start over';
      restart.addEventListener('click', () => { current = 0; render(); });
      res.append(restart);
      panel.append(res);
      return;
    }

    // question state
    const { q, options } = questions[current];

    const meta = document.createElement('div');
    meta.className = 'eligibility-checker-meta';
    const step = document.createElement('span');
    step.className = 'eligibility-checker-step';
    step.textContent = `Question ${current + 1} of ${questions.length}`;
    const pct = Math.round(((current + 1) / questions.length) * 100);
    const pctEl = document.createElement('span');
    pctEl.className = 'eligibility-checker-pct';
    pctEl.textContent = `${pct}%`;
    meta.append(step, pctEl);
    panel.append(meta);

    const bar = document.createElement('div');
    bar.className = 'eligibility-checker-bar';
    const fill = document.createElement('div');
    fill.className = 'eligibility-checker-bar-fill';
    fill.style.width = `${pct}%`;
    bar.append(fill);
    panel.append(bar);

    const qh = document.createElement('h3');
    qh.className = 'eligibility-checker-question';
    qh.textContent = q;
    panel.append(qh);

    const opts = document.createElement('div');
    opts.className = 'eligibility-checker-options';
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'eligibility-checker-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => { current += 1; render(); });
      opts.append(btn);
    });
    panel.append(opts);
  }

  render();

  block.textContent = '';
  block.append(wrapper);
}
