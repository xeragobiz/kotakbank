// Sentry is loaded from a CDN at runtime: EDS serves modules as-is (no bundler),
// so a bare "@sentry/browser" specifier can't resolve in the browser. The esm.sh
// build maps the "@sentry/browser" package to a browser-native ES module.
// Public Sentry.io cloud DSN so it's reachable from the public site (a private/
// self-hosted host is blocked by the browser's Private Network Access).
const SENTRY_MODULE_URL = 'https://esm.sh/@sentry/browser@10.65.0';
const DSN = 'https://8f3c99cccbfab19dc79a2a7801501512@o4511738502512640.ingest.us.sentry.io/4511767734255616';

export default async function initSentry() {
  let Sentry;
  try {
    Sentry = await import(SENTRY_MODULE_URL);
  } catch (e) {
    // never let monitoring break the page
    return false;
  }

  Sentry.init({
    dsn: DSN,
    environment: 'qa',
    release: 'eds-banking-1.0.0',
    integrations: [
      // send console.log, console.warn, and console.error calls as logs to Sentry
      Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
    ],
    // enable logs to be sent to Sentry
    enableLogs: true,
  });

  // custom metrics (guarded — the metrics API may be absent in some SDK builds)
  if (Sentry.metrics) {
    Sentry.metrics.count('button_click', 1);
    Sentry.metrics.gauge('page_load_time', 150);
    Sentry.metrics.distribution('response_time', 200);
  }

  return true;
}
