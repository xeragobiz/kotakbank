// Sentry is loaded from a CDN at runtime: EDS serves modules as-is (no bundler),
// so a bare "@sentry/browser" specifier can't resolve in the browser.
// We deliberately avoid browser-tracing and session-replay integrations — they
// are the heaviest, legacy-JS-laden parts of the SDK and hurt performance.
// This keeps monitoring to lightweight error capture only.
const SENTRY_MODULE_URL = 'https://esm.sh/@sentry/browser@10.65.0';
const DEFAULT_DSN = '';

function getConfiguredValue(key) {
  const value = window[key] || window[`__${key}__`] || '';
  return String(value).trim();
}

export default async function initSentry() {
  const dsn = getConfiguredValue('SENTRY_DSN') || DEFAULT_DSN;
  const environment = getConfiguredValue('SENTRY_ENVIRONMENT') || window.location.hostname || 'localhost';
  const release = getConfiguredValue('SENTRY_RELEASE') || window.hlx?.version || 'local';

  if (!dsn) {
    return false;
  }

  let Sentry;
  try {
    Sentry = await import(SENTRY_MODULE_URL);
  } catch (e) {
    // never let monitoring break the page
    return false;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    // no integrations: errors-only, smallest footprint
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 1.0,
    enabled: true,
    beforeSend(event) {
      const exceptionMessage = event.exception?.values?.[0]?.value || '';
      if (/ResizeObserver loop limit exceeded|Script error/i.test(exceptionMessage)) {
        return null;
      }
      return event;
    },
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('sentry-test') === '1') {
    Sentry.captureException(new Error('Sentry test exception from QA'));
  }

  return true;
}
