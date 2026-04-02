import { Firestore, doc, serverTimestamp, setDoc } from 'firebase/firestore';

export type LessonProgressRecord = {
  completed?: boolean;
  completedAt?: unknown;
  quizScore?: number | null;
  quizAttempts?: number;
  lastQuizAt?: unknown;
};

export type LearningProgressDocument = {
  trackId?: string;
  completedLessons?: string[];
  lessonProgress?: Record<string, LessonProgressRecord>;
  moduleProgress?: Record<string, number>;
  personalization?: {
    progressSummary?: string;
    weaknesses?: string[];
    learningStyle?: string;
    updatedAt?: unknown;
  };
  updatedAt?: unknown;
};

export async function setLessonCompletion(
  db: Firestore,
  uid: string,
  lessonId: string,
  completed: boolean,
  moduleProgress: Record<string, number>
) {
  const ref = doc(db, 'users', uid, 'learning', 'progress');

  await setDoc(
    ref,
    {
      trackId: 'zerodha-technical-analysis-module-2',
      lessonProgress: {
        [lessonId]: {
          completed,
          completedAt: completed ? serverTimestamp() : null,
        },
      },
      moduleProgress,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function saveQuizScore(
  db: Firestore,
  uid: string,
  lessonId: string,
  score: number,
  existingAttempts: number,
  moduleProgress: Record<string, number>
) {
  const ref = doc(db, 'users', uid, 'learning', 'progress');

  await setDoc(
    ref,
    {
      trackId: 'zerodha-technical-analysis-module-2',
      lessonProgress: {
        [lessonId]: {
          quizScore: score,
          quizAttempts: existingAttempts + 1,
          lastQuizAt: serverTimestamp(),
        },
      },
      moduleProgress,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function savePersonalizationContext(
  db: Firestore,
  uid: string,
  input: {
    progressSummary: string;
    weaknesses: string[];
    learningStyle: string;
  },
  moduleProgress: Record<string, number>
) {
  const ref = doc(db, 'users', uid, 'learning', 'progress');

  await setDoc(
    ref,
    {
      trackId: 'zerodha-technical-analysis-module-2',
      personalization: {
        progressSummary: input.progressSummary,
        weaknesses: input.weaknesses,
        learningStyle: input.learningStyle,
        updatedAt: serverTimestamp(),
      },
      moduleProgress,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
