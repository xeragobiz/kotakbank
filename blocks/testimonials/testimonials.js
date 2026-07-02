/**
 * Testimonials — "Credit Cards that everyone is talking about".
 * Heading + a row of review cards (name, star rating, review, date) in a
 * scroll-snap carousel with prev/next controls. Container + review items.
 * @param {Element} block the block element
 */
const STAR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f5a623'%3E%3Cpath d='M12 2l3 6.9 7.5.6-5.7 4.9 1.8 7.3L12 17.8 5.4 21.7l1.8-7.3L1.5 9.5 9 8.9z'/%3E%3C/svg%3E\")";

export default function decorate(block) {
  const rows = [...block.children];

  // heading = the row with no numeric rating; items have author/rating/review/date
  let heading = '';
  const items = [];
  rows.forEach((r) => {
    const cells = [...r.children].map((c) => c.querySelector(':scope > div') || c);
    const numCell = cells.find((c) => /^\s*[1-5]\s*$/.test(c.textContent));
    if (!numCell && cells.length <= 1) {
      const t = (cells[0] || r).textContent.trim();
      if (t) heading = t;
      return;
    }
    const rating = numCell ? parseInt(numCell.textContent.trim(), 10) : 5;
    const rich = cells.find((c) => c !== numCell && c.querySelector('p, ul, ol'));
    const plain = cells.filter((c) => c !== numCell && c !== rich && c.textContent.trim());
    // author is the first plain text, date is the last (contains digits / "Reviewed")
    const author = plain[0] ? plain[0].textContent.trim() : '';
    const date = plain.length > 1 ? plain[plain.length - 1].textContent.trim() : '';
    items.push({
      author, rating, rich, date,
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

  items.forEach((it) => {
    const li = document.createElement('li');
    li.className = 'testimonials-card';

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
  wrapper.append(viewport);

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
    wrapper.append(nav);
  }

  block.style.setProperty('--testimonials-star-img', STAR);
  block.textContent = '';
  block.append(wrapper);
}
