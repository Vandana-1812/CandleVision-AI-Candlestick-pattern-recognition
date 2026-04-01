import { NextRequest, NextResponse } from 'next/server';
import { reportServerError } from '@/lib/telemetry';
import {
  computeResult,
  fetchExitPrice,
  getEvaluationWindowMs,
  PendingSignalPayload,
  VerificationResult,
} from '@/lib/performance-verification';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { signals?: PendingSignalPayload[] };
    const incoming = Array.isArray(body.signals) ? body.signals : [];

    const signals = incoming.filter(
      (signal) =>
        typeof signal?.id === 'string' &&
        typeof signal?.symbol === 'string' &&
        typeof signal?.signal === 'string' &&
        typeof signal?.entryTimeMs === 'number' &&
        Number.isFinite(signal.entryPrice) &&
        signal.entryPrice > 0
    );

    if (signals.length === 0) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const now = Date.now();
    const evaluationWindowMs = getEvaluationWindowMs();

    const results = await Promise.all(
      signals.map(async (signal) => {
        const evaluationTimeMs = signal.entryTimeMs + evaluationWindowMs;
        if (now < evaluationTimeMs) return null;

        const exitPrice = await fetchExitPrice(signal.symbol, evaluationTimeMs);
        if (!exitPrice) return null;

        return computeResult(signal, exitPrice);
      })
    );

    return NextResponse.json(
      {
        results: results.filter((result): result is VerificationResult => result !== null),
      },
      { status: 200 }
    );
  } catch (error) {
    reportServerError('api.performance.verify', error);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}
