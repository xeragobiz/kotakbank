import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Testimonials — "Credit Cards that everyone is talking about".
 * Heading + a row of review cards (name, star rating, review, date) in a
 * scroll-snap carousel with prev/next controls. Container + review items.
 *
 * Rows are classified by CELL COUNT: the container heading is a single-cell
 * row, each Review is a multi-cell row. Each review <li> keeps the source
 * row's data-aue-* via moveInstrumentation so items stay visible/editable in
 * Universal Editor even before all fields are filled.
 * @param {Element} block the block element
 */
const STAR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f5a623'%3E%3Cpath d='M12 2l3 6.9 7.5.6-5.7 4.9 1.8 7.3L12 17.8 5.4 21.7l1.8-7.3L1.5 9.5 9 8.9z'/%3E%3C/svg%3E\")";

export default function decorate(block) {
  const rows = [...block.children];

  // heading = single-cell row; review items are multi-cell rows
  let heading = '';
  const items = [];
  rows.forEach((r) => {
    const cells = [...r.children].map((c) => c.querySelector(':scope > div') || c);
    if (cells.length <= 1) {
      const t = (cells[0] || r).textContent.trim();
      if (t) heading = t;
      return;
    }
    // Classify by content type (robust to cell grouping/ordering):
    //  - rating: a bare 1-5 number
    //  - date:   contains "Reviewed" or a date-like digits/slash pattern
    //  - review: the longest remaining text cell (a full sentence)
    //  - author: the remaining short text cell (a name)
    const numCell = cells.find((c) => /^\s*[1-5]\s*$/.test(c.textContent));
    const rating = numCell ? parseInt(numCell.textContent.trim(), 10) : 5;
    const dateCell = cells.find((c) => c !== numCell
      && /reviewed|\d{1,4}[/-]\d{1,2}[/-]\d{1,4}/i.test(c.textContent));
    const textCells = cells.filter((c) => c !== numCell && c !== dateCell
      && c.textContent.trim());
    // longest text = the review; the other = the author name
    const rich = textCells
      .slice()
      .sort((a, b) => b.textContent.trim().length - a.textContent.trim().length)[0] || null;
    const authorCell = textCells.find((c) => c !== rich) || null;
    const author = authorCell ? authorCell.textContent.trim() : '';
    const date = dateCell ? dateCell.textContent.trim() : '';
    items.push({
      row: r, author, rating, rich, date,
    });
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'testimonials-inner';

  if (heading) {
    const h = document.createElement('h2');
    h.className = 'testimonials-title';
    h.textContent = heading;
    wrapper.append(h);
  }

  const viewport = document.createElement('div');
  viewport.className = 'testimonials-viewport';
  const track = document.createElement('ul');
  track.className = 'testimonials-track';
  // the track scrolls horizontally — make it keyboard-focusable and labelled
  track.tabIndex = 0;
  track.setAttribute('role', 'group');
  track.setAttribute('aria-label', 'Customer reviews');

  items.forEach((it) => {
    const li = document.createElement('li');
    li.className = 'testimonials-card';
    // preserve the child component's instrumentation so it stays editable
    moveInstrumentation(it.row, li);

    if (it.author) {
      const name = document.createElement('p');
      name.className = 'testimonials-author';
      name.textContent = it.author;
      li.append(name);
    }

    const stars = document.createElement('div');
    stars.className = 'testimonials-stars';
    stars.setAttribute('role', 'img');
    stars.setAttribute('aria-label', `${it.rating} out of 5 stars`);
    for (let i = 0; i < 5; i += 1) {
      const s = document.createElement('span');
      s.className = i < it.rating ? 'testimonials-star testimonials-star-on' : 'testimonials-star';
      stars.append(s);
    }
    li.append(stars);

    if (it.rich) {
      const body = document.createElement('div');
      body.className = 'testimonials-review';
      [...it.rich.childNodes].forEach((n) => body.append(n.cloneNode(true)));
      li.append(body);
    }

    if (it.date) {
      const d = document.createElement('p');
      d.className = 'testimonials-date';
      d.textContent = it.date;
      li.append(d);
    }

    track.append(li);
  });

  viewport.append(track);

  // carousel wraps the viewport so side arrows can be centered against the
  // card row (on mobile they sit on the left/right edges of the card)
  const carousel = document.createElement('div');
  carousel.className = 'testimonials-carousel';
  carousel.append(viewport);

  // prev / next controls
  if (items.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'testimonials-nav';
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'testimonials-prev';
    prev.setAttribute('aria-label', 'Previous reviews');
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'testimonials-next';
    next.setAttribute('aria-label', 'Next reviews');
    const scrollBy = () => {
      const card = track.querySelector('.testimonials-card');
      return card ? card.getBoundingClientRect().width + 20 : 300;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -scrollBy(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: scrollBy(), behavior: 'smooth' }));
    nav.append(prev, next);
    carousel.append(nav);
  }
  wrapper.append(carousel);

  block.style.setProperty('--testimonials-star-img', STAR);
  block.textContent = '';
  block.append(wrapper);
}
