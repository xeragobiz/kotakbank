import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Resume Application — a dismissible "pick up where you left off" banner.
 * Red outer band with a title + close button, wrapping a white card that shows
 * the product name, heading, a status/step line, a progress bar, up to two
 * CTAs, and an image with a small "Get your card now" badge.
 *
 * Fields are grouped into cells (to stay within the block cell limit):
 *   - copy cell: bannerTitle, eyebrow, heading, meta, progress, badge (<p>s in order)
 *   - image cell (alt text collapses onto the <img>)
 *   - primary CTA cell (link)
 *   - secondary CTA cell (link)
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r);

  const imageCell = cells.find((c) => c.querySelector('picture'));
  const linkCells = cells.filter((c) => c !== imageCell && c.querySelector('a'));
  // copy cell = the text-only cell holding the heading/paragraphs
  const copyCell = cells.find((c) => c !== imageCell
    && !c.querySelector('a, picture')
    && c.textContent.trim());

  // copy paragraphs in order: bannerTitle, eyebrow, heading, meta, progress, badge
  const copy = copyCell ? [...copyCell.querySelectorAll('p')].map((p) => p.textContent.trim()) : [];
  const bannerTitle = copy[0] || 'Pick where you left';
  const eyebrow = copy[1] || '';
  const heading = copy[2] || '';
  const meta = copy[3] || '';
  const hasProgress = copy[4] !== undefined && copy[4] !== '';
  const percent = Math.max(0, Math.min(100, parseInt(copy[4], 10) || 0));
  const badgeText = copy[5] || '';

  const pic = imageCell ? imageCell.querySelector('picture') : null;
  const img = pic ? pic.querySelector('img') : null;

  // ----- build -----
  const banner = document.createElement('div');
  banner.className = 'resume-application-banner';

  // inline icons (no author upload): a history/undo clock for the title and a
  // schedule clock for the status line.
  const HISTORY_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v5h5"/><path d="M3.05 13a9 9 0 1 0 2.6-6.36L3 8"/><path d="M12 7v5l3 2"/></svg>';
  const SCHEDULE_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  const bar = document.createElement('div');
  bar.className = 'resume-application-bar';
  const barTitle = document.createElement('span');
  barTitle.className = 'resume-application-bar-title';
  const barIcon = document.createElement('span');
  barIcon.className = 'resume-application-bar-icon';
  barIcon.innerHTML = HISTORY_ICON;
  const barLabel = document.createElement('span');
  barLabel.textContent = bannerTitle;
  barTitle.append(barIcon, barLabel);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'resume-application-close';
  close.setAttribute('aria-label', 'Dismiss');
  close.textContent = '×';
  close.addEventListener('click', () => { block.hidden = true; });
  bar.append(barTitle, close);

  const card = document.createElement('div');
  card.className = 'resume-application-card';

  const body = document.createElement('div');
  body.className = 'resume-application-body';
  if (eyebrow) {
    const e = document.createElement('p');
    e.className = 'resume-application-eyebrow';
    e.textContent = eyebrow;
    body.append(e);
  }
  if (heading) {
    const h = document.createElement('h3');
    h.className = 'resume-application-heading';
    h.textContent = heading;
    body.append(h);
  }
  if (meta) {
    const m = document.createElement('p');
    m.className = 'resume-application-meta';
    const metaIcon = document.createElement('span');
    metaIcon.className = 'resume-application-meta-icon';
    metaIcon.innerHTML = SCHEDULE_ICON;
    const metaLabel = document.createElement('span');
    metaLabel.textContent = meta;
    m.append(metaIcon, metaLabel);
    body.append(m);
  }
  if (hasProgress) {
    const track = document.createElement('div');
    track.className = 'resume-application-progress';
    const fill = document.createElement('span');
    fill.className = 'resume-application-progress-fill';
    fill.style.width = `${percent}%`;
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuenow', String(percent));
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.append(fill);
    body.append(track);
  }
  if (linkCells.length) {
    const actions = document.createElement('div');
    actions.className = 'resume-application-actions';
    linkCells.forEach((c, i) => {
      const link = c.querySelector('a');
      link.className = i === 0
        ? 'resume-application-btn resume-application-btn-primary'
        : 'resume-application-btn resume-application-btn-secondary';
      actions.append(link);
    });
    body.append(actions);
  }

  card.append(body);

  if (img) {
    const media = document.createElement('div');
    media.className = 'resume-application-media';
    media.append(createOptimizedPicture(img.src, img.getAttribute('alt') || '', false, [{ width: '750' }]));
    if (badgeText) {
      const badge = document.createElement('span');
      badge.className = 'resume-application-badge';
      badge.textContent = badgeText;
      media.append(badge);
    }
    card.append(media);
  }

  banner.append(bar, card);
  block.replaceChildren(banner);
}
