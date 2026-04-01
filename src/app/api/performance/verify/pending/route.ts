import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { reportServerError } from '@/lib/telemetry';
import {
  computeResult,
  fetchExitPrice,
  getEvaluationWindowHours,
  getEvaluationWindowMs,
  PendingSignalPayload,
} from '@/lib/performance-verification';

type PendingSignalDoc = {
  symbol?: string;
  signal?: string;
  entryPrice?: number;
  timestamp?: { toDate?: () => Date; seconds?: number } | string | Date;
  predictionResult?: string;
};

function timestampToMs(raw: PendingSignalDoc['timestamp']) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw.toDate === 'function') return raw.toDate().getTime();
  if (typeof raw.seconds === 'number') return raw.seconds * 1000;
  return null;
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.VERIFICATION_CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';

  const header = request.headers.get('x-cron-secret');
  return header === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({
        status: 'skipped',
        reason: 'admin-db-unavailable',
        message: 'Firebase Admin is not configured. Scheduled verification requires admin env vars.',
      });
    }

    const now = Date.now();
    const evaluationWindowMs = getEvaluationWindowMs();
    const maxEligibleEntryTime = now - evaluationWindowMs;

    const snapshot = await adminDb
      .collectionGroup('signals')
      .where('predictionResult', '==', 'pending')
      .where('timestamp', '<=', new Date(maxEligibleEntryTime))
      .orderBy('timestamp', 'asc')
      .limit(200)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        status: 'ok',
        scanned: 0,
        verified: 0,
        evaluationWindowHours: getEvaluationWindowHours(),
      });
    }

    let verifiedCount = 0;
    let skippedCount = 0;

    await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data() as PendingSignalDoc;

        const symbol = String(data.symbol || '').trim();
        const signal = String(data.signal || '').trim();
        const entryPrice = Number(data.entryPrice);
        const entryTimeMs = timestampToMs(data.timestamp);

        if (!symbol || !signal || !Number.isFinite(entryPrice) || entryPrice <= 0 || !entryTimeMs) {
          skippedCount += 1;
          return;
        }

        const payload: PendingSignalPayload = {
          id: docSnapshot.id,
          symbol,
          signal,
          entryPrice,
          entryTimeMs,
        };

        const exitPrice = await fetchExitPrice(payload.symbol, payload.entryTimeMs + evaluationWindowMs);
        if (!exitPrice) {
          skippedCount += 1;
          return;
        }

        const result = computeResult(payload, exitPrice);

        await docSnapshot.ref.update({
          isVerified: result.isVerified,
          predictionResult: result.predictionResult,
          profitLoss: result.profitLoss,
          exitPrice: result.exitPrice,
          evaluationWindowHours: result.evaluationWindowHours,
          exitLogic: result.exitLogic,
          verificationBasis: result.verificationBasis,
          resultSource: result.resultSource,
          verifiedAt: FieldValue.serverTimestamp(),
        });

        verifiedCount += 1;
      })
    );

    return NextResponse.json({
      status: 'ok',
      scanned: snapshot.size,
      verified: verifiedCount,
      skipped: skippedCount,
      evaluationWindowHours: getEvaluationWindowHours(),
      firstDocPath: snapshot.docs[0]?.ref.path || null,
    });
  } catch (error) {
    reportServerError('api.performance.verify.pending', error);
    return NextResponse.json({ error: 'Batch verification failed.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const run = request.nextUrl.searchParams.get('run') === '1';
  if (!run) {
    return NextResponse.json({
      status: 'ready',
      route: '/api/performance/verify/pending',
      method: 'POST',
      auth: 'x-cron-secret header when VERIFICATION_CRON_SECRET is set',
    });
  }

  return POST(request);
}