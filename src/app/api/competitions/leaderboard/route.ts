import { NextRequest, NextResponse } from 'next/server';
import { buildLeaderboard, CompetitionSubmissionRecord } from '@/lib/competition-store';
import { getAdminDb } from '@/lib/firebase-admin';
import { reportServerError } from '@/lib/telemetry';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || '';

    const adminDb = getAdminDb();

    // Production mode: require Firestore backing. No in-memory fallback allowed.
    if (!adminDb) {
      reportServerError('api.competitions.leaderboard', new Error('Firestore not initialized: productionleaderboard requires Firebase Admin SDK'));
      return NextResponse.json(
        { error: 'Leaderboard data requires production database initialization.' },
        { status: 503 },
      );
    }

    const snapshot = await adminDb
      .collection('competitionSubmissions')
      .orderBy('submittedAtMs', 'desc')
      .limit(1000)
      .get();
    const records = snapshot.docs.map((doc) => doc.data() as CompetitionSubmissionRecord);
    const rows = buildLeaderboard(records);

    const top = rows.slice(0, 12);

    let userTier = rows.slice(0, 4);
    if (userId) {
      const current = rows.find((row) => row.userId === userId);
      if (current) {
        userTier = rows
          .filter((row) => Math.abs(row.rank - current.rank) <= 2)
          .slice(0, 6);
      }
    }

    return NextResponse.json({
      leaderboard: top,
      tier: userTier,
      persistence: 'firestore-admin',
    });
  } catch (error) {
    reportServerError('api.competitions.leaderboard', error);
    return NextResponse.json({ error: 'Unable to load leaderboard.' }, { status: 500 });
  }
}
