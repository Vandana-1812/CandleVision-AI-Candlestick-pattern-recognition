'use client';

import { useEffect } from 'react';
import { emitClientTelemetry, reportClientError } from '@/lib/telemetry';

export function TelemetryBridge() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError('window.error', event.error || event.message, {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      });

      void emitClientTelemetry('window.error', 'Unhandled browser error captured', {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportClientError('window.unhandledrejection', event.reason);
      void emitClientTelemetry('window.unhandledrejection', 'Unhandled promise rejection captured');
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
