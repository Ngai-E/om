import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('⚠️  Sentry DSN not configured - error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    // Additional options
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      
      // Filter out localStorage/sessionStorage
      if (event.contexts?.['Local Storage']) {
        delete event.contexts['Local Storage'];
      }
      if (event.contexts?.['Session Storage']) {
        delete event.contexts['Session Storage'];
      }
      
      return event;
    },
  });

  console.log('✅ Sentry initialized for error monitoring');
}

export { Sentry };
