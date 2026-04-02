import { NextResponse } from 'next/server';
import { CompetitionChallenge } from '@/lib/competition-data';
import { getAdminDb } from '@/lib/firebase-admin';
import { reportServerError } from '@/lib/telemetry';

export async function GET() {
  try {
    const adminDb = getAdminDb();

    if (!adminDb) {
      reportServerError('api.competitions.challenges', new Error('Firestore not initialized: competition challenges require Firebase Admin SDK'));
      return NextResponse.json(
        { error: 'Competition challenges require production database initialization.' },
        { status: 503 },
      );
    }

    const snapshot = await adminDb.collection('competitionChallenges').orderBy('createdAtMs', 'desc').limit(100).get();
    const challenges = snapshot.docs.map((doc) => doc.data() as CompetitionChallenge);

    return NextResponse.json({
      challenges,
      source: 'firestore-admin',
    });
  } catch (error) {
    reportServerError('api.competitions.challenges', error);
    return NextResponse.json({ error: 'Unable to load challenges.' }, { status: 500 });
  }
}
