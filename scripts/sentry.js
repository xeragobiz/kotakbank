// Sentry is loaded from a CDN at runtime: EDS serves modules as-is (no bundler),
// so a bare "@sentry/browser" specifier can't resolve in the browser. The esm.sh
// build maps the "@sentry/browser" package to a browser-native ES module.
// Public Sentry.io cloud DSN so it's reachable from the public site (a private/
// self-hosted host is blocked by the browser's Private Network Access).
const SENTRY_MODULE_URL = 'https://esm.sh/@sentry/browser@10.65.0';
const DSN = 'https://8f3c99cccbfab19dc79a2a7801501512@o4511738502512640.ingest.us.sentry.io/4511767734255616';

/**
 * Derive the Sentry environment from the host so events are tagged correctly:
 *  - live site (.aem.live or the production domain) -> "production"
 *  - preview (.aem.page)                            -> "qa"
 *  - localhost / anything else                      -> "development"
 */
function resolveEnvironment() {
  const host = window.location.hostname;
  if (host.endsWith('.aem.live') || host.endsWith('kotak.com')) return 'production';
  if (host.endsWith('.aem.page')) return 'qa';
  return 'development';
}

export default async function initSentry() {
  let Sentry;
  try {
    Sentry = await import(SENTRY_MODULE_URL);
  } catch (e) {
    // never let monitoring break the page
    return false;
  }

  Sentry.init({
    debug: true,
    dsn: DSN,
    environment: resolveEnvironment(),
    release: 'eds-banking-1.0.0',
    integrations: [
      // send console.log, console.warn, and console.error calls as logs to Sentry
      Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
      Sentry.replayIntegration(),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // enable logs to be sent to Sentry
    enableLogs: true,
    dataCollection: {
      // defaults (Sentry collects user data + HTTP bodies). To disable, set:
      // userInfo: false,
      // httpBodies: [],
      // docs: https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection
    },
  });

  // custom metrics (guarded — the metrics API may be absent in some SDK builds)
  if (Sentry.metrics) {
    Sentry.metrics.count('button_click', 1);
    Sentry.metrics.gauge('page_load_time', 150);
    Sentry.metrics.distribution('response_time', 200);
  }

  // Verification hook: append ?sentry-test=1 to any URL to force a test
  // exception, confirming events reach the Sentry dashboard. The event is
  // tagged with whichever environment the host resolves to (e.g. production
  // when fired on the live site), so QA can verify prod delivery too.
  const params = new URLSearchParams(window.location.search);
  if (params.get('sentry-test') === '1') {
    Sentry.captureException(new Error(`Sentry test exception (${resolveEnvironment()})`));
  }

  return true;
}
