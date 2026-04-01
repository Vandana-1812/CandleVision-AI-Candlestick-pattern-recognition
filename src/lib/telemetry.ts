type TelemetrySeverity = 'info' | 'warn' | 'error';

type TelemetryPayload = {
  scope: 'client' | 'server';
  category: string;
  message: string;
  details?: Record<string, unknown>;
  severity?: TelemetrySeverity;
  timestamp?: string;
};

function toSerializableError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function logTelemetry(payload: TelemetryPayload) {
  const enriched = {
    severity: payload.severity ?? 'error',
    timestamp: payload.timestamp ?? new Date().toISOString(),
    ...payload,
  };

  if (enriched.severity === 'info') {
    console.info('[telemetry]', enriched);
    return;
  }

  if (enriched.severity === 'warn') {
    console.warn('[telemetry]', enriched);
    return;
  }

  console.error('[telemetry]', enriched);
}

export function reportServerError(category: string, error: unknown, details?: Record<string, unknown>) {
  logTelemetry({
    scope: 'server',
    category,
    message: 'Unhandled server error',
    details: {
      ...details,
      error: toSerializableError(error),
    },
    severity: 'error',
  });
}

export function reportServerTelemetry(
  category: string,
  message: string,
  severity: TelemetrySeverity = 'info',
  details?: Record<string, unknown>
) {
  logTelemetry({
    scope: 'server',
    category,
    message,
    details,
    severity,
  });
}

export function reportClientError(category: string, error: unknown, details?: Record<string, unknown>) {
  logTelemetry({
    scope: 'client',
    category,
    message: 'Unhandled client error',
    details: {
      ...details,
      error: toSerializableError(error),
    },
    severity: 'error',
  });
}

export async function emitClientTelemetry(category: string, message: string, details?: Record<string, unknown>) {
  const payload: TelemetryPayload = {
    scope: 'client',
    category,
    message,
    details,
    severity: 'info',
  };

  logTelemetry(payload);

  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Telemetry should never block user interactions.
  }
}
