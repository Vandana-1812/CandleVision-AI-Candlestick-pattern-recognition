import { NextRequest, NextResponse } from 'next/server';

// NOTE:
// - POST /api/telemetry ingests arbitrary client/server events.
// - GET  /api/telemetry/market-health returns provider health snapshots,
//   keeps short in-memory history, and emits alerts when providers are down.

type TelemetryPayload = {
  scope?: string;
  category?: string;
  message?: string;
  details?: Record<string, unknown>;
  severity?: 'info' | 'warn' | 'error';
  timestamp?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TelemetryPayload;

    console.info('[telemetry.ingest]', {
      scope: body.scope || 'client',
      category: body.category || 'unknown',
      message: body.message || 'No message provided',
      severity: body.severity || 'info',
      details: body.details || {},
      timestamp: body.timestamp || new Date().toISOString(),
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
