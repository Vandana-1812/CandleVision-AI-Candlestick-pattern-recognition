import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { evaluateCompetitionAnswer } from '@/lib/competition-feedback';
import { CompetitionChallenge } from '@/lib/competition-data';
import { CompetitionSubmissionRecord } from '@/lib/competition-store';
import { getAdminDb } from '@/lib/firebase-admin';
import { reportServerError } from '@/lib/telemetry';

type SubmitPayload = {
  challengeId: string;
  answer: string;
  userId: string;
  operator: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SubmitPayload>;

    const challengeId = String(body.challengeId || '').trim();
    const answer = String(body.answer || '').trim();
    const userId = String(body.userId || '').trim();
    const operator = String(body.operator || '').trim() || 'Operator';

    if (!challengeId || !answer || !userId) {
      return NextResponse.json({ error: 'challengeId, answer, and userId are required.' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      reportServerError('api.competitions.submit', new Error('Firestore not initialized: competition submissions require Firebase Admin SDK'));
      return NextResponse.json(
        { error: 'Competition submissions require production database initialization.' },
        { status: 503 },
      );
    }

    let challenge: CompetitionChallenge | null = null;
    const challengeByDocId = await adminDb.collection('competitionChallenges').doc(challengeId).get();
    if (challengeByDocId.exists) {
      challenge = challengeByDocId.data() as CompetitionChallenge;
    } else {
      const challengeByField = await adminDb
        .collection('competitionChallenges')
        .where('id', '==', challengeId)
        .limit(1)
        .get();
      if (!challengeByField.empty) {
        challenge = challengeByField.docs[0].data() as CompetitionChallenge;
      }
    }

    if (!challenge) {
      return NextResponse.json({ error: 'Invalid challenge.' }, { status: 400 });
    }

    const feedback = evaluateCompetitionAnswer(challenge, answer);

    const record: CompetitionSubmissionRecord = {
      id: randomUUID(),
      challengeId,
      challengeName: challenge.name,
      userId,
      operator,
      score: feedback.score,
      verdict: feedback.verdict,
      submittedAtMs: Date.now(),
    };

    await adminDb.collection('competitionSubmissions').doc(record.id).set(record);

    return NextResponse.json({
      feedback,
      record: {
        id: record.id,
        score: record.score,
        verdict: record.verdict,
        challengeId: record.challengeId,
      },
      persistence: 'firestore-admin',
    });
  } catch (error) {
    reportServerError('api.competitions.submit', error);
    return NextResponse.json({ error: 'Unable to submit challenge answer.' }, { status: 500 });
  }
}
