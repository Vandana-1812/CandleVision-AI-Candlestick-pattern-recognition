"use client";

import Link from 'next/link';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { indicatorSprint, zerodhaTechnicalAnalysisTrack } from '@/lib/learning-tracks';
import {
  Award,
  BookOpen,
  ExternalLink,
  GraduationCap,
  LineChart,
  ListChecks,
  PlayCircle,
  Timer,
} from 'lucide-react';

const coverage = [
  { label: 'Foundations', value: 28 },
  { label: 'Patterns', value: 36 },
  { label: 'Indicators', value: 22 },
  { label: 'Execution', value: 14 },
];

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

export default function LearningPage() {
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
                    </article>
                  ))}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-6">
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
