"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { indicatorSprint, zerodhaTechnicalAnalysisTrack } from '@/lib/learning-tracks';
import {
  LearningProgressDocument,
  savePersonalizationContext,
  saveQuizScore,
  setLessonCompletion,
} from '@/lib/learning-progress';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  Award,
  BrainCircuit,
  BookOpen,
  ExternalLink,
  GraduationCap,
  LineChart,
  Loader2,
  ListChecks,
  PlayCircle,
  Timer,
} from 'lucide-react';

const studySteps = [
  {
    title: 'Watch the official lesson',
    copy: 'Each lesson opens the original Zerodha Varsity chapter or video series source in a new tab.',
  },
  {
    title: 'Answer the checkpoint',
    copy: 'Use the checkpoint prompt as your quick self-test before moving to the next lesson.',
  },
  {
    title: 'Apply it immediately',
    copy: 'Take the concept into Market Replay or Competitions so the lesson turns into pattern memory.',
  },
];

const sprintLessons = zerodhaTechnicalAnalysisTrack.lessons.filter((lesson) =>
  indicatorSprint.lessonIds.includes(lesson.id)
);

type PersonalizedLearningResult = {
  learningPath: Array<{
    module: string;
    description: string;
  }>;
  rationale: string;
};

export default function LearningPage() {
  const { user } = useUser();
  const db = useFirestore();

  const progressRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'learning', 'progress');
  }, [db, user]);

  const { data: progressDoc } = useDoc<LearningProgressDocument>(progressRef);

  const [progressSummary, setProgressSummary] = useState(
    'Foundations 28%, Patterns 36%, Indicators 22%, Execution 14%. I am consistent with videos but struggle to convert concepts into clear trade plans.'
  );
  const [weaknessesText, setWeaknessesText] = useState(
    'Support/resistance validation, Indicator stacking, Risk-reward planning'
  );
  const [learningStyle, setLearningStyle] = useState('visual');
  const [personalizedResult, setPersonalizedResult] = useState<PersonalizedLearningResult | null>(null);
  const [personalizationError, setPersonalizationError] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [quizDrafts, setQuizDrafts] = useState<Record<string, string>>({});
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);
  const [savingQuizId, setSavingQuizId] = useState<string | null>(null);
  const personalizationHydratedRef = useRef(false);

  const lessonById = useMemo(() => {
    const map = new Map<string, (typeof zerodhaTechnicalAnalysisTrack.lessons)[number]>();
    for (const lesson of zerodhaTechnicalAnalysisTrack.lessons) {
      map.set(lesson.id, lesson);
    }
    return map;
  }, []);

  const categoryTotals = useMemo(() => {
    return {
      foundation: zerodhaTechnicalAnalysisTrack.lessons.filter((lesson) => lesson.category === 'foundation').length,
      patternsAndLevels: zerodhaTechnicalAnalysisTrack.lessons.filter(
        (lesson) => lesson.category === 'patterns' || lesson.category === 'levels'
      ).length,
      indicators: zerodhaTechnicalAnalysisTrack.lessons.filter((lesson) => lesson.category === 'indicators').length,
      execution: zerodhaTechnicalAnalysisTrack.lessons.filter((lesson) => lesson.category === 'execution').length,
    };
  }, []);

  const moduleProgressFromCompletedSet = useCallback((completedSet: Set<string>) => {
    let foundation = 0;
    let patternsAndLevels = 0;
    let indicators = 0;
    let execution = 0;

    completedSet.forEach((lessonId) => {
      const lesson = lessonById.get(lessonId);
      if (!lesson) return;
      if (lesson.category === 'foundation') foundation += 1;
      if (lesson.category === 'patterns' || lesson.category === 'levels') patternsAndLevels += 1;
      if (lesson.category === 'indicators') indicators += 1;
      if (lesson.category === 'execution') execution += 1;
    });

    const ratio = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

    return {
      foundations: ratio(foundation, categoryTotals.foundation),
      patterns: ratio(patternsAndLevels, categoryTotals.patternsAndLevels),
      indicators: ratio(indicators, categoryTotals.indicators),
      execution: ratio(execution, categoryTotals.execution),
    };
  }, [categoryTotals, lessonById]);

  const coverage = useMemo(() => {
    const progress = moduleProgressFromCompletedSet(completedLessons);
    return [
      { label: 'Foundations', value: progress.foundations },
      { label: 'Patterns', value: progress.patterns },
      { label: 'Indicators', value: progress.indicators },
      { label: 'Execution', value: progress.execution },
    ];
  }, [completedLessons, moduleProgressFromCompletedSet]);

  useEffect(() => {
    if (!progressDoc) return;

    const lessonProgress = progressDoc.lessonProgress || {};
    const completed = new Set<string>();
    const draftScores: Record<string, string> = {};

    Object.entries(lessonProgress).forEach(([lessonId, progress]) => {
      if (progress?.completed) completed.add(lessonId);
      if (typeof progress?.quizScore === 'number') draftScores[lessonId] = String(progress.quizScore);
    });

    setCompletedLessons(completed);
    setQuizDrafts((current) => ({ ...draftScores, ...current }));

    if (!personalizationHydratedRef.current && progressDoc.personalization) {
      if (progressDoc.personalization.progressSummary) {
        setProgressSummary(progressDoc.personalization.progressSummary);
      }
      if (Array.isArray(progressDoc.personalization.weaknesses)) {
        setWeaknessesText(progressDoc.personalization.weaknesses.join(', '));
      }
      if (progressDoc.personalization.learningStyle) {
        setLearningStyle(progressDoc.personalization.learningStyle);
      }
      personalizationHydratedRef.current = true;
    }
  }, [progressDoc]);

  const handleToggleLessonCompletion = async (lessonId: string) => {
    if (!db || !user) {
      setSaveFeedback('Sign in to save learning progress.');
      return;
    }

    const nextCompleted = new Set(completedLessons);
    const markCompleted = !nextCompleted.has(lessonId);

    if (markCompleted) nextCompleted.add(lessonId);
    else nextCompleted.delete(lessonId);

    setCompletedLessons(nextCompleted);
    setSavingLessonId(lessonId);
    setSaveFeedback('');

    try {
      await setLessonCompletion(db, user.uid, lessonId, markCompleted, moduleProgressFromCompletedSet(nextCompleted));
      setSaveFeedback(markCompleted ? 'Lesson marked complete.' : 'Lesson marked pending.');
    } catch {
      setCompletedLessons(new Set(completedLessons));
      setSaveFeedback('Unable to save lesson completion right now.');
    } finally {
      setSavingLessonId(null);
    }
  };

  const handleSaveQuiz = async (lessonId: string) => {
    if (!db || !user) {
      setSaveFeedback('Sign in to save quiz progress.');
      return;
    }

    const raw = quizDrafts[lessonId] ?? '';
    const parsed = Number(raw);

    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setSaveFeedback('Quiz score must be between 0 and 100.');
      return;
    }

    const attempts = progressDoc?.lessonProgress?.[lessonId]?.quizAttempts ?? 0;

    setSavingQuizId(lessonId);
    setSaveFeedback('');

    try {
      await saveQuizScore(
        db,
        user.uid,
        lessonId,
        parsed,
        attempts,
        moduleProgressFromCompletedSet(completedLessons)
      );
      setSaveFeedback('Quiz score saved.');
    } catch {
      setSaveFeedback('Unable to save quiz score right now.');
    } finally {
      setSavingQuizId(null);
    }
  };

  const handleGeneratePlan = async () => {
    setPersonalizationError('');
    setIsGeneratingPlan(true);

    try {
      const weaknesses = weaknessesText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (db && user) {
        await savePersonalizationContext(
          db,
          user.uid,
          {
            progressSummary,
            weaknesses,
            learningStyle,
          },
          moduleProgressFromCompletedSet(completedLessons)
        );
      }

      const response = await fetch('/api/learning/personalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProgress: progressSummary,
          identifiedWeaknesses: weaknesses,
          learningStyle,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to generate a personalized learning plan.');
      }

      setPersonalizedResult(payload as PersonalizedLearningResult);
    } catch (error: any) {
      setPersonalizationError(error?.message || 'Unable to generate a personalized learning plan.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Learning Hub</Badge>
              <Badge variant="outline" className="border-primary/30 text-muted-foreground">
                Zerodha-based track
              </Badge>
            </div>
            <div className="space-y-2">
              <h1 className="font-headline text-3xl font-bold tracking-tight text-white md:text-5xl">
                TECHNICAL ANALYSIS TRACK
              </h1>
              <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
                Study the full Zerodha Varsity technical analysis video sequence in one guided path. We link to the
                official lessons and layer on our own checkpoints, summaries, and practice flow.
              </p>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="space-y-6">
              <Card className="border-primary/20 bg-card/70 backdrop-blur">
                <CardHeader className="space-y-5 border-b border-primary/10 pb-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/15 p-3">
                          <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-headline text-xs uppercase tracking-[0.32em] text-primary">
                            Guided Curriculum
                          </p>
                          <CardTitle className="font-headline text-2xl text-white">
                            {zerodhaTechnicalAnalysisTrack.provider} Module 2
                          </CardTitle>
                        </div>
                      </div>
                      <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                        Full runtime is {zerodhaTechnicalAnalysisTrack.totalDuration}. It covers chart structure,
                        candlestick logic, support and resistance, indicators, moving averages, and a usable trading
                        checklist.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild>
                        <Link href={zerodhaTechnicalAnalysisTrack.moduleUrl} target="_blank" rel="noreferrer">
                          <PlayCircle className="h-4 w-4" />
                          Open Official Videos
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={zerodhaTechnicalAnalysisTrack.playlistUrl} target="_blank" rel="noreferrer">
                          <BookOpen className="h-4 w-4" />
                          Open Full Module
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-primary/15 bg-background/50 p-4">
                      <p className="font-headline text-xs uppercase tracking-[0.28em] text-muted-foreground">
                        Total Runtime
                      </p>
                      <p className="mt-3 font-headline text-3xl text-white">
                        {zerodhaTechnicalAnalysisTrack.totalDuration}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-primary/15 bg-background/50 p-4">
                      <p className="font-headline text-xs uppercase tracking-[0.28em] text-muted-foreground">
                        Lessons
                      </p>
                      <p className="mt-3 font-headline text-3xl text-white">
                        {zerodhaTechnicalAnalysisTrack.lessonsCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-primary/15 bg-background/50 p-4">
                      <p className="font-headline text-xs uppercase tracking-[0.28em] text-muted-foreground">
                        Indicators Sprint
                      </p>
                      <p className="mt-3 font-headline text-3xl text-white">{indicatorSprint.totalDuration}</p>
                    </div>
                    <div className="rounded-2xl border border-primary/15 bg-background/50 p-4">
                      <p className="font-headline text-xs uppercase tracking-[0.28em] text-muted-foreground">
                        Study Mode
                      </p>
                      <p className="mt-3 font-headline text-3xl text-white">Guided</p>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-2xl border border-primary/15 bg-background/40 p-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="font-headline text-xs uppercase tracking-[0.32em] text-muted-foreground">
                        Coverage Map
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Use the full sequence for a complete pass, or jump into the sprint if you want the
                        indicator-heavy lessons first.
                      </p>
                    </div>
                    <div className="grid gap-4">
                      {coverage.map((item) => (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-headline uppercase tracking-[0.18em] text-white">{item.label}</span>
                            <span className="text-muted-foreground">{item.value}%</span>
                          </div>
                          <Progress value={item.value} className="h-2 bg-white/5" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/15 bg-background/40 p-4">
                    <p className="font-headline text-xs uppercase tracking-[0.28em] text-muted-foreground">
                      Completed Lessons
                    </p>
                    <p className="mt-2 text-2xl font-headline text-white">
                      {completedLessons.size} / {zerodhaTechnicalAnalysisTrack.lessonsCount}
                    </p>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-primary/20 bg-card/70 backdrop-blur">
                <CardHeader className="border-b border-primary/10">
                  <CardTitle className="flex items-center gap-3 font-headline text-2xl text-white">
                    <LineChart className="h-5 w-5 text-primary" />
                    Lesson Map
                  </CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Every lesson keeps the official source link, plus a checkpoint prompt you can use as your study
                    exit ticket.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6">
                  {zerodhaTechnicalAnalysisTrack.lessons.map((lesson, index) => (
                    <article
                      key={lesson.id}
                      className="rounded-2xl border border-primary/15 bg-background/40 p-5 transition-colors hover:border-primary/35"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-primary text-primary-foreground">Lesson {index + 1}</Badge>
                            <Badge variant="outline" className="border-primary/20 uppercase text-muted-foreground">
                              {lesson.category}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-headline text-2xl text-white">{lesson.title}</h3>
                            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{lesson.focus}</p>
                          </div>
                        </div>

                        <div className="min-w-[140px] rounded-2xl border border-primary/15 bg-background/60 p-4">
                          <p className="font-headline text-xs uppercase tracking-[0.28em] text-muted-foreground">
                            Duration
                          </p>
                          <p className="mt-3 font-headline text-2xl text-white">{lesson.duration}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
                        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                          <p className="font-headline text-xs uppercase tracking-[0.28em] text-primary">
                            Checkpoint
                          </p>
                          <p className="mt-3 text-sm leading-7 text-white/90">{lesson.checkpoint}</p>
                        </div>
                        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-primary/10 bg-background/60 p-4">
                          <p className="text-sm leading-6 text-muted-foreground">
                            Opens Zerodha Varsity in a new tab so you stay on the official lesson source.
                          </p>
                          <Button asChild variant="outline" className="w-full justify-between">
                            <Link href={lesson.url} target="_blank" rel="noreferrer">
                              Open Official Lesson
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-2xl border border-primary/10 bg-background/40 p-4 md:grid-cols-[1fr_auto]">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Status: <span className="font-semibold text-white">{completedLessons.has(lesson.id) ? 'Completed' : 'Pending'}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={quizDrafts[lesson.id] ?? ''}
                              onChange={(event) =>
                                setQuizDrafts((current) => ({
                                  ...current,
                                  [lesson.id]: event.target.value,
                                }))
                              }
                              className="h-9 w-36 bg-white/5 border-white/10"
                              placeholder="Quiz score"
                            />
                            <Button
                              variant="secondary"
                              className="h-9"
                              onClick={() => void handleSaveQuiz(lesson.id)}
                              disabled={savingQuizId === lesson.id}
                            >
                              {savingQuizId === lesson.id ? 'Saving...' : 'Save Quiz'}
                            </Button>
                          </div>
                        </div>

                        <Button
                          onClick={() => void handleToggleLessonCompletion(lesson.id)}
                          disabled={savingLessonId === lesson.id}
                          className="h-9"
                        >
                          {savingLessonId === lesson.id
                            ? 'Saving...'
                            : completedLessons.has(lesson.id)
                            ? 'Mark Pending'
                            : 'Mark Completed'}
                        </Button>
                      </div>
                    </article>
                  ))}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-6">
              {saveFeedback ? (
                <p className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
                  {saveFeedback}
                </p>
              ) : null}

              <Card className="border-primary/20 bg-card/70 backdrop-blur">
                <CardHeader className="border-b border-primary/10">
                  <CardTitle className="flex items-center gap-3 font-headline text-2xl text-white">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    AI Personalized Plan
                  </CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Convert your study status into a targeted module sequence generated by the personalization flow.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <p className="font-headline text-xs uppercase tracking-[0.28em] text-muted-foreground">Progress Summary</p>
                    <Textarea
                      value={progressSummary}
                      onChange={(event) => setProgressSummary(event.target.value)}
                      className="min-h-24 bg-white/5 border-white/10"
                      placeholder="Describe your current progress and quiz outcomes"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="font-headline text-xs uppercase tracking-[0.28em] text-muted-foreground">Weaknesses (comma-separated)</p>
                    <Input
                      value={weaknessesText}
                      onChange={(event) => setWeaknessesText(event.target.value)}
                      className="bg-white/5 border-white/10"
                      placeholder="Candlestick confirmation, Risk discipline, Indicator context"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="font-headline text-xs uppercase tracking-[0.28em] text-muted-foreground">Preferred Learning Style</p>
                    <Select value={learningStyle} onValueChange={setLearningStyle}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Choose learning style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visual">Visual</SelectItem>
                        <SelectItem value="auditory">Auditory</SelectItem>
                        <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                        <SelectItem value="text-based">Text-based</SelectItem>
                        <SelectItem value="interactive">Interactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" onClick={handleGeneratePlan} disabled={isGeneratingPlan || !progressSummary.trim()}>
                    {isGeneratingPlan ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Plan...
                      </>
                    ) : (
                      'Generate Personalized Plan'
                    )}
                  </Button>

                  {personalizationError ? (
                    <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {personalizationError}
                    </p>
                  ) : null}

                  {personalizedResult ? (
                    <div className="space-y-3 rounded-2xl border border-primary/15 bg-background/40 p-4">
                      <p className="font-headline text-xs uppercase tracking-[0.28em] text-primary">AI Recommendation</p>
                      <p className="text-sm leading-6 text-muted-foreground">{personalizedResult.rationale}</p>
                      <div className="space-y-2">
                        {personalizedResult.learningPath.map((item, index) => (
                          <div key={`${item.module}-${index}`} className="rounded-xl border border-primary/10 bg-background/50 p-3">
                            <p className="font-headline text-sm uppercase tracking-[0.16em] text-white">{index + 1}. {item.module}</p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/70 backdrop-blur">
                <CardHeader className="border-b border-primary/10">
                  <CardTitle className="flex items-center gap-3 font-headline text-2xl text-white">
                    <Timer className="h-5 w-5 text-primary" />
                    {indicatorSprint.title}
                  </CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">{indicatorSprint.description}</p>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="rounded-2xl border border-primary/15 bg-background/50 p-4">
                    <p className="font-headline text-xs uppercase tracking-[0.28em] text-muted-foreground">
                      Runtime
                    </p>
                    <p className="mt-3 font-headline text-3xl text-white">{indicatorSprint.totalDuration}</p>
                  </div>
                  {sprintLessons.map((lesson) => (
                    <div key={lesson.id} className="rounded-2xl border border-primary/10 bg-background/40 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-headline text-lg text-white">{lesson.title}</h3>
                        <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{lesson.focus}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/70 backdrop-blur">
                <CardHeader className="border-b border-primary/10">
                  <CardTitle className="flex items-center gap-3 font-headline text-2xl text-white">
                    <ListChecks className="h-5 w-5 text-primary" />
                    How To Use
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {studySteps.map((step, index) => (
                    <div key={step.title} className="rounded-2xl border border-primary/10 bg-background/40 p-4">
                      <p className="font-headline text-xs uppercase tracking-[0.28em] text-primary">Step {index + 1}</p>
                      <h3 className="mt-2 font-headline text-xl text-white">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.copy}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-accent/20 bg-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 font-headline text-xl uppercase tracking-tight text-accent">
                    <Award className="h-5 w-5" />
                    Next Milestone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-lg font-semibold text-white">
                    Finish all 12 lessons, then take one competition challenge with a written answer.
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    That gives you one complete theory pass plus one applied checkpoint inside the product.
                  </p>
                  <div className="rounded-2xl border border-primary/15 bg-background/40 p-4">
                    <p className="font-headline text-xs uppercase tracking-[0.28em] text-muted-foreground">
                      Full Track Runtime
                    </p>
                    <p className="mt-3 font-headline text-2xl text-white">
                      {zerodhaTechnicalAnalysisTrack.totalDuration}
                    </p>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={zerodhaTechnicalAnalysisTrack.sourceUrl} target="_blank" rel="noreferrer">
                      View All Video Modules
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
