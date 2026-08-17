/*
 * Locale ("MSM"-style multi-language) support for this EDS project.
 *
 * Edge Delivery Services has no built-in Multi Site Manager. This module
 * implements the convention-based equivalent: a locale-prefixed content tree
 * (/en, /hi, …) served from one shared codebase. All blocks, styles and
 * scripts are shared across every locale (the "rolled-out" code layer); only
 * content, placeholders and the nav/footer fragments differ per locale.
 *
 * A page path looks like:  /<locale>/<page-path>
 *   /en/kotak-league-credit-card   (master locale)
 *   /hi/kotak-league-credit-card   (Hindi "live copy")
 *
 * Pages that are NOT under a known locale prefix are treated as the default
 * locale (so existing root-level pages keep working unchanged).
 */

// Known locales. `default` is the master ("blueprint") locale and the
// fallback when a locale-specific resource (placeholders/nav/footer) is
// missing. `dir` drives the document text direction (rtl for e.g. Arabic).
export const LOCALES = {
  en: { label: 'English', dir: 'ltr' },
  hi: { label: 'हिन्दी', dir: 'ltr' },
};

export const DEFAULT_LOCALE = 'en';

/**
 * Detect the current locale from a path's first segment.
 * Falls back to DEFAULT_LOCALE for root-level / unknown-prefix pages.
 * @param {string} [pathname] path to inspect (defaults to the current page)
 * @returns {string} a key of LOCALES
 */
export function getLocale(pathname = window.location.pathname) {
  const seg = pathname.split('/').filter(Boolean)[0];
  return seg && Object.prototype.hasOwnProperty.call(LOCALES, seg)
    ? seg
    : DEFAULT_LOCALE;
}

/**
 * The content root for a locale. The default locale lives at the site root so
 * existing pages need no migration; other locales live under `/<locale>`.
 * @param {string} [locale]
 * @returns {string} e.g. '' for the default locale, '/hi' otherwise
 */
export function getLocaleRoot(locale = getLocale()) {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

/**
 * Strip the locale prefix from a path, returning the "logical" page path that
 * is identical across locales (the MSM live-copy relationship).
 * @param {string} [pathname]
 * @returns {string} path without the locale segment, always leading-slashed
 */
export function stripLocale(pathname = window.location.pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] && Object.prototype.hasOwnProperty.call(LOCALES, parts[0])
    && parts[0] !== DEFAULT_LOCALE) {
    parts.shift();
  }
  return `/${parts.join('/')}`;
}

/**
 * Build the equivalent page path in another locale (used by the language
 * switcher and hreflang tags).
 * @param {string} locale target locale
 * @param {string} [pathname] current path
 * @returns {string} the same logical page under `locale`
 */
export function localizePath(locale, pathname = window.location.pathname) {
  const logical = stripLocale(pathname);
  const root = getLocaleRoot(locale);
  // avoid a trailing-slash-only path for the home page
  if (logical === '/') return root || '/';
  return `${root}${logical}`;
}

/**
 * Resolve a locale-scoped resource path (nav, footer, placeholders.json …),
 * e.g. resolveLocalized('nav') -> '/hi/nav' under Hindi, '/nav' under default.
 * @param {string} name resource name without extension (or with, for json)
 * @param {string} [locale]
 * @returns {string}
 */
export function resolveLocalized(name, locale = getLocale()) {
  const clean = name.replace(/^\//, '');
  return `${getLocaleRoot(locale)}/${clean}`;
}
