import {
  createOptimizedPicture,
  decorateIcons,
} from '../../scripts/aem.js';

const searchParams = new URLSearchParams(window.location.search);

function findNextHeading(el) {
  let preceedingEl = el.parentElement.previousElement || el.parentElement.parentElement;
  let h = 'H2';
  while (preceedingEl) {
    const lastHeading = [...preceedingEl.querySelectorAll('h1, h2, h3, h4, h5, h6')].pop();
    if (lastHeading) {
      const level = parseInt(lastHeading.nodeName[1], 10);
      h = level < 6 ? `H${level + 1}` : 'H6';
      preceedingEl = false;
    } else {
      preceedingEl = preceedingEl.previousElement || preceedingEl.parentElement;
    }
  }
  return h;
}

function highlightTextElements(terms, elements) {
  elements.forEach((element) => {
    if (!element || !element.textContent) return;

    const matches = [];
    const { textContent } = element;
    terms.forEach((term) => {
      let start = 0;
      let offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      while (offset >= 0) {
        matches.push({ offset, term: textContent.substring(offset, offset + term.length) });
        start = offset + term.length;
        offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      }
    });

    if (!matches.length) {
      return;
    }

    matches.sort((a, b) => a.offset - b.offset);
    let currentIndex = 0;
    const fragment = matches.reduce((acc, { offset, term }) => {
      if (offset < currentIndex) return acc;
      const textBefore = textContent.substring(currentIndex, offset);
      if (textBefore) {
        acc.appendChild(document.createTextNode(textBefore));
      }
      const markedTerm = document.createElement('mark');
      markedTerm.textContent = term;
      acc.appendChild(markedTerm);
      currentIndex = offset + term.length;
      return acc;
    }, document.createDocumentFragment());
    const textAfter = textContent.substring(currentIndex);
    if (textAfter) {
      fragment.appendChild(document.createTextNode(textAfter));
    }
    element.innerHTML = '';
    element.appendChild(fragment);
  });
}

// pages excluded from search results (nav/header and footer fragments)
const EXCLUDED_PATHS = ['/nav', '/header', '/footer'];

export async function fetchData(source) {
  const response = await fetch(source);
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('error loading API response', response);
    return null;
  }

  const json = await response.json();
  if (!json) {
    // eslint-disable-next-line no-console
    console.error('empty API response', source);
    return null;
  }

  // search all pages except the header/footer fragments (ignore trailing slash)
  return json.data.filter((row) => !EXCLUDED_PATHS.includes(row.path.replace(/(.)\/$/, '$1')));
}

function renderResult(result, searchTerms, titleTag) {
  const li = document.createElement('li');

  if (result.image) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-result-image';
    const imgLink = document.createElement('a');
    imgLink.href = result.path;
    const pic = createOptimizedPicture(result.image, '', false, [{ width: '375' }]);
    imgLink.append(pic);
    wrapper.append(imgLink);
    li.append(wrapper);
  }

  const body = document.createElement('div');
  body.className = 'search-result-body';
  if (result.title) {
    const title = document.createElement(titleTag);
    title.className = 'search-result-title';
    const link = document.createElement('a');
    link.href = result.path;
    link.textContent = result.title;
    highlightTextElements(searchTerms, [link]);
    title.append(link);
    body.append(title);
  }
  if (result.description) {
    const description = document.createElement('p');
    description.textContent = result.description;
    highlightTextElements(searchTerms, [description]);
    body.append(description);
  }
  // "Know More" button → the result's details page
  const more = document.createElement('a');
  more.className = 'search-result-more';
  more.href = result.path;
  more.textContent = 'Know More';
  body.append(more);

  li.append(body);
  return li;
}

function clearSearchResults(block) {
  const searchResults = block.querySelector('.search-results');
  searchResults.innerHTML = '';
}

/* show the Recent/Most-searched suggestions and hide the results list */
function showSuggestions(block, show) {
  const panel = block.querySelector('.search-suggestions');
  if (panel) panel.hidden = !show;
}

function clearSearch(block) {
  clearSearchResults(block);
  showSuggestions(block, true);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = '';
    searchParams.delete('q');
    window.history.replaceState({}, '', url.toString());
  }
}

async function renderResults(block, config, filteredData, searchTerms) {
  clearSearchResults(block);
  showSuggestions(block, false);
  const searchResults = block.querySelector('.search-results');
  const headingTag = searchResults.dataset.h;

  if (filteredData.length) {
    searchResults.classList.remove('no-results');
    filteredData.forEach((result) => {
      const li = renderResult(result, searchTerms, headingTag);
      searchResults.append(li);
    });
  } else {
    const noResultsMessage = document.createElement('li');
    searchResults.classList.add('no-results');
    noResultsMessage.textContent = config.placeholders.searchNoResults || 'No results found.';
    searchResults.append(noResultsMessage);
  }
}

function compareFound(hit1, hit2) {
  return hit1.minIdx - hit2.minIdx;
}

function filterData(searchTerms, data) {
  const foundInHeader = [];
  const foundInMeta = [];

  data.forEach((result) => {
    let minIdx = -1;

    const headerText = (result.header || result.title || '').toLowerCase();
    searchTerms.forEach((term) => {
      const idx = headerText.indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInHeader.push({ minIdx, result });
      return;
    }

    const pathTail = (result.path || '').split('/').pop();
    const metaContents = `${result.title || ''} ${result.description || ''} ${pathTail}`.toLowerCase();
    searchTerms.forEach((term) => {
      const idx = metaContents.indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInMeta.push({ minIdx, result });
    }
  });

  return [
    ...foundInHeader.sort(compareFound),
    ...foundInMeta.sort(compareFound),
  ].map((item) => item.result);
}

const RECENT_KEY = 'kb-search-recent';
const RECENT_MAX = 6;

function getRecentSearches() {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function recordRecentSearch(term) {
  const clean = term.trim();
  if (!clean) return;
  try {
    const list = getRecentSearches().filter((t) => t.toLowerCase() !== clean.toLowerCase());
    list.unshift(clean);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch (err) {
    // storage unavailable — recent search history simply isn't persisted
  }
}

async function handleSearch(e, block, config) {
  const searchValue = e.target.value;
  searchParams.set('q', searchValue);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    window.history.replaceState({}, '', url.toString());
  }

  if (searchValue.length < 3) {
    clearSearch(block);
    return;
  }
  const searchTerms = searchValue.toLowerCase().split(/\s+/).filter((term) => !!term);

  const data = await fetchData(config.source);
  const filteredData = filterData(searchTerms, data);
  recordRecentSearch(searchValue);
  await renderResults(block, config, filteredData, searchTerms);
}

function searchResultsContainer(block) {
  const results = document.createElement('ul');
  results.className = 'search-results';
  results.dataset.h = findNextHeading(block);

  // add ARIA live region for screen reader announcements
  results.setAttribute('role', 'status');
  results.setAttribute('aria-live', 'polite');
  results.setAttribute('aria-atomic', true);

  return results;
}

function searchInput(block, config) {
  const input = document.createElement('input');
  input.setAttribute('type', 'search');
  input.className = 'search-input';

  const searchPlaceholder = config.placeholders.searchPlaceholder || 'Search...';
  input.placeholder = searchPlaceholder;
  input.setAttribute('aria-label', searchPlaceholder);

  input.addEventListener('input', (e) => {
    handleSearch(e, block, config);
  });

  input.addEventListener('keyup', (e) => { if (e.code === 'Escape') { clearSearch(block); } });

  return input;
}

function searchIcon() {
  const icon = document.createElement('span');
  icon.classList.add('icon', 'icon-search');
  return icon;
}

function searchBox(block, config) {
  const box = document.createElement('div');
  box.classList.add('search-box');
  box.append(
    searchIcon(),
    searchInput(block, config),
  );

  return box;
}

/* inline SVG glyphs for the "Most searched" links */
const LINK_ICONS = {
  card: "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300005a' stroke-width='2'%3E%3Crect x='2' y='5' width='20' height='14' rx='2'/%3E%3Cpath d='M2 10h20'/%3E%3C/svg%3E",
  cash: "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300005a' stroke-width='2'%3E%3Crect x='2' y='6' width='20' height='12' rx='2'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3C/svg%3E",
  bank: "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300005a' stroke-width='2'%3E%3Cpath d='M3 21h18M4 10h16M12 3l9 5H3zM6 10v11M18 10v11M10 10v11M14 10v11'/%3E%3C/svg%3E",
  search: "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300005a' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='M21 21l-4.3-4.3'/%3E%3C/svg%3E",
};

/* read the authored "Most searched" link items from the block's item rows */
function readLinks(block) {
  return [...block.children]
    .filter((row) => row.children.length > 1)
    .map((row) => {
      const cells = [...row.children];
      const text = cells.map((c) => c.textContent.trim());
      const iconKey = (text.find((t) => LINK_ICONS[t.toLowerCase()]) || 'search').toLowerCase();
      const link = row.querySelector('a[href]');
      const label = (link && link.textContent.trim())
        || text.find((t) => t && !LINK_ICONS[t.toLowerCase()])
        || '';
      return { iconKey, label, href: link ? link.getAttribute('href') : '#' };
    })
    .filter((item) => item.label);
}

/* build the Recent search + Most searched panel shown before/without results */
function buildSuggestions(block, links, recentSeed) {
  const panel = document.createElement('div');
  panel.className = 'search-suggestions';

  const recent = getRecentSearches();
  const chips = recent.length ? recent : recentSeed;
  if (chips.length) {
    const sec = document.createElement('div');
    sec.className = 'search-suggestions-section search-recent';
    const h = document.createElement('h3');
    h.className = 'search-suggestions-heading';
    h.textContent = 'Recent search';
    const row = document.createElement('div');
    row.className = 'search-chips';
    chips.forEach((term) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'search-chip';
      chip.textContent = term;
      chip.addEventListener('click', () => {
        const input = block.querySelector('.search-input');
        input.value = term;
        input.dispatchEvent(new Event('input'));
        input.focus();
      });
      row.append(chip);
    });
    sec.append(h, row);
    panel.append(sec);
  }

  if (links.length) {
    const sec = document.createElement('div');
    sec.className = 'search-suggestions-section search-most';
    const h = document.createElement('h3');
    h.className = 'search-suggestions-heading';
    h.textContent = 'Most searched';
    const list = document.createElement('ul');
    list.className = 'search-most-list';
    links.forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'search-most-link';
      a.href = item.href;
      const icon = document.createElement('span');
      icon.className = 'search-most-icon';
      icon.style.setProperty('--icon', `url("data:image/svg+xml,${LINK_ICONS[item.iconKey]}")`);
      const label = document.createElement('span');
      label.className = 'search-most-label';
      label.textContent = item.label;
      a.append(icon, label);
      li.append(a);
      list.append(li);
    });
    sec.append(h, list);
    panel.append(sec);
  }

  return panel.children.length ? panel : null;
}

export default async function decorate(block) {
  // separate the query-index source (a single-cell row with just a link) from
  // the "Most searched" link items (multi-cell rows) before consuming the DOM.
  const sourceRow = [...block.children]
    .find((row) => row.children.length <= 1 && row.querySelector('a[href]'));
  const source = sourceRow ? sourceRow.querySelector('a[href]').href : '/query-index.json';

  // authored recent-search seed: a single-cell text row (no link, comma list)
  const recentRow = [...block.children].find((row) => row.children.length <= 1
    && !row.querySelector('a[href]') && row.textContent.trim());
  const recentSeed = recentRow
    ? recentRow.textContent.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const links = readLinks(block);

  block.innerHTML = '';
  block.append(
    searchBox(block, { source, placeholders: {} }),
    searchResultsContainer(block),
  );

  const suggestions = buildSuggestions(block, links, recentSeed);
  if (suggestions) {
    block.querySelector('.search-results').before(suggestions);
  }

  if (searchParams.get('q')) {
    const input = block.querySelector('input');
    input.value = searchParams.get('q');
    input.dispatchEvent(new Event('input'));
  }

  decorateIcons(block);
}
