import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'https://16af6dee84f28f5b28487764feb725a6@o4509688035016704.ingest.us.sentry.io/4509688215896064', // replace with your actual DSN
  enableInExpoDevelopment: true,
  debug: __DEV__, // Only log debug info in development
});
