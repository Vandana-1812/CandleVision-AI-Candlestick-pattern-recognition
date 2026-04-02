import { NextRequest, NextResponse } from 'next/server';
import { personalizeLearningPaths } from '@/ai/flows/personalize-learning-paths';
import { reportServerError } from '@/lib/telemetry';

type PersonalizePayload = {
  userProgress: string;
  identifiedWeaknesses: string[];
  learningStyle: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<PersonalizePayload>;

    const userProgress = (body.userProgress || '').trim();
    const learningStyle = (body.learningStyle || '').trim();
    const identifiedWeaknesses = Array.isArray(body.identifiedWeaknesses)
      ? body.identifiedWeaknesses.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
      : [];

    if (!userProgress) {
      return NextResponse.json({ error: 'userProgress is required.' }, { status: 400 });
    }

    if (!learningStyle) {
      return NextResponse.json({ error: 'learningStyle is required.' }, { status: 400 });
    }

    const result = await personalizeLearningPaths({
      userProgress,
      identifiedWeaknesses,
      learningStyle,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    reportServerError('api.learning.personalize', error);
    return NextResponse.json(
      { error: 'Failed to generate personalized learning plan.' },
      { status: 500 }
    );
  }
}
