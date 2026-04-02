"use client";

import Link from 'next/link';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getChallengeById } from '@/lib/competition-data';
import { CompetitionFeedback, evaluateCompetitionAnswer } from '@/lib/competition-feedback';
import { useCompetitionRoster } from '@/hooks/use-competition-roster';
import { useUser } from '@/firebase';
import { ArrowLeft, CheckCircle2, ShieldCheck, Target, Timer, Trophy, Users, Wallet } from 'lucide-react';

export default function CompetitionChallengePage() {
  const params = useParams<{ challengeId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { hydrated, isJoined, joinChallenge } = useCompetitionRoster();
  const challengeId = typeof params.challengeId === 'string' ? params.challengeId : '';
  const challenge = getChallengeById(challengeId);
  const [submission, setSubmission] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [feedback, setFeedback] = React.useState<CompetitionFeedback | null>(null);

  if (!challenge) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6">
          <Card className="holographic-card border-primary/20 max-w-3xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl uppercase glow-blue">Challenge not found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">This competition room does not exist or is no longer live.</p>
              <Button asChild className="font-headline uppercase text-xs bg-primary hover:bg-primary/80 text-white">
                <Link href="/competitions">Return to competitions</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const joined = isJoined(challenge.id);

  const handleJoin = () => {
    if (!joined) {
      joinChallenge(challenge.id);
      toast({
        title: 'Challenge room unlocked',
        description: `${challenge.name} is now in your active competition roster.`,
      });
      return;
    }

    toast({
      title: 'Challenge ready',
      description: 'You are already entered. Review the rules and launch your prep flow.',
    });
  };

  const handleReplayPrep = () => {
    if (!joined) {
      toast({
        title: 'Join required',
        description: 'Enter the challenge first so it becomes part of your active roster.',
        variant: 'destructive',
      });
      return;
    }

    router.push('/replay');
  };

  const handleSubmitAnswer = () => {
    if (!joined) {
      toast({
        title: 'Join required',
        description: 'Join the challenge first, then submit your answer.',
        variant: 'destructive',
      });
      return;
    }

    if (!submission.trim()) {
      toast({
        title: 'Answer needed',
        description: 'Write your trade idea before submitting.',
        variant: 'destructive',
      });
      return;
    }

    void (async () => {
      try {
        const response = await fetch('/api/competitions/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            challengeId: challenge.id,
            answer: submission,
            userId: user?.uid || 'anonymous-user',
            operator: user?.displayName || user?.email || 'You',
          }),
        });

        if (!response.ok) {
          throw new Error('Submission API failed');
        }

        const payload = (await response.json()) as { feedback: CompetitionFeedback; persistence?: string };
        setFeedback(payload.feedback);
        setSubmitted(true);

        toast({
          title: 'Answer submitted',
          description: `Feedback ready: ${payload.feedback.verdict.toLowerCase()} (${payload.feedback.score}/100).`,
        });
      } catch {
        const nextFeedback = evaluateCompetitionAnswer(challenge, submission);
        setFeedback(nextFeedback);
        setSubmitted(true);
        toast({
          title: 'Answer submitted (local fallback)',
          description: `Feedback ready: ${nextFeedback.verdict.toLowerCase()} (${nextFeedback.score}/100).`,
        });
      }
    })();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header className="space-y-4">
          <Link href="/competitions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Return to competitions
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3 max-w-4xl">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-primary/10 text-primary border-primary/20 uppercase font-headline tracking-[0.18em]">
                  {challenge.style}
                </Badge>
                <Badge className="bg-white/5 text-muted-foreground border-white/10 uppercase font-headline tracking-[0.16em]">
                  {challenge.format}
                </Badge>
                <Badge className="bg-accent/10 text-accent border-accent/20 uppercase font-headline tracking-[0.16em]">
                  {joined ? 'Joined room' : 'Open entry'}
                </Badge>
              </div>

              <div>
                <h1 className="text-3xl font-headline font-bold glow-blue">{challenge.name}</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">{challenge.objective}</p>
                <p className="text-base text-white mt-4 max-w-3xl">{challenge.task}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={handleJoin}
                className={`font-headline uppercase text-xs ${
                  joined
                    ? 'bg-accent text-black hover:bg-accent/80'
                    : 'bg-primary hover:bg-primary/80 text-white'
                }`}
              >
                {joined ? 'Challenge joined' : 'Join this challenge'}
              </Button>
              <Button
                variant="outline"
                onClick={handleReplayPrep}
                className="font-headline uppercase text-xs border-white/10 bg-white/[0.03]"
              >
                Launch replay prep
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
          <div className="space-y-6">
            <Card className="holographic-card border-primary/20">
              <CardHeader className="border-b border-white/5 pb-5">
                <CardTitle className="font-headline text-lg uppercase glow-blue flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Challenge Task
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Symbol Set</p>
                    <p className="font-headline text-lg mt-2">{challenge.symbol}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Duration</p>
                    <p className="font-headline text-lg mt-2">{challenge.duration}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Difficulty</p>
                    <p className="font-headline text-lg mt-2">{challenge.difficulty}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Reward</p>
                    <p className="font-headline text-lg mt-2">{challenge.reward}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-background/35 p-5 space-y-3">
                    <p className="text-[10px] uppercase font-headline tracking-[0.18em] text-muted-foreground">What You Must Answer</p>
                    <div className="space-y-3">
                      {challenge.deliverables.map((rule) => (
                        <div key={rule} className="rounded-xl border border-white/10 bg-background/35 px-4 py-3 text-sm text-muted-foreground">
                          {rule}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-background/35 p-5 space-y-3">
                    <p className="text-[10px] uppercase font-headline tracking-[0.18em] text-muted-foreground">How You Win</p>
                    <div className="space-y-3">
                      {challenge.evaluation.map((item) => (
                        <div key={item} className="rounded-xl border border-white/10 bg-background/35 px-4 py-3 text-sm text-muted-foreground">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="holographic-card border-primary/20">
              <CardHeader>
                <CardTitle className="font-headline text-lg uppercase glow-blue flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Submission Console
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-background/35 p-5 space-y-3">
                  <p className="text-[10px] uppercase font-headline tracking-[0.18em] text-muted-foreground">Your Answer</p>
                  <Textarea
                    value={submission}
                    onChange={(event) => setSubmission(event.target.value)}
                    placeholder="Example: Long above 74,120, stop 73,880, target 74,620. Reason: price is holding above the breakout base and momentum is expanding."
                    className="min-h-32 bg-background/60 border-white/10 font-body"
                  />
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm text-muted-foreground">
                      Keep it short: action, level, risk, and one reason.
                    </p>
                    <Badge className="bg-white/5 text-muted-foreground border-white/10 uppercase font-headline tracking-[0.16em]">
                      {submitted ? 'submitted' : 'draft'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    onClick={handleSubmitAnswer}
                    className="font-headline uppercase text-xs bg-primary hover:bg-primary/80 text-white"
                  >
                    {submitted ? 'Update feedback' : 'Submit answer'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReplayPrep}
                    className="font-headline uppercase text-xs border-white/10 bg-white/[0.03]"
                  >
                    Open replay for analysis
                  </Button>
                </div>

                {feedback && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/8 p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-[10px] uppercase font-headline tracking-[0.18em] text-primary">Coach feedback</p>
                        <p className="font-headline text-2xl mt-2">{feedback.verdict}</p>
                        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{feedback.summary}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-right">
                        <p className="text-[10px] uppercase font-headline text-muted-foreground">Score</p>
                        <p className="font-headline text-2xl text-accent mt-1">{feedback.score}/100</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-white/10 bg-background/40 p-4 space-y-3">
                        <p className="text-[10px] uppercase font-headline tracking-[0.18em] text-muted-foreground">What worked</p>
                        <div className="space-y-3">
                          {feedback.strengths.map((item) => (
                            <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-background/35 px-4 py-3 text-sm text-muted-foreground">
                              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-background/40 p-4 space-y-3">
                        <p className="text-[10px] uppercase font-headline tracking-[0.18em] text-muted-foreground">Where to improve</p>
                        <div className="space-y-3">
                          {feedback.improvements.map((item) => (
                            <div key={item} className="rounded-xl border border-white/10 bg-background/35 px-4 py-3 text-sm text-muted-foreground">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="holographic-card border-primary/25 bg-gradient-to-br from-primary/10 via-background to-background">
              <CardHeader>
                <CardTitle className="font-headline text-sm uppercase flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Room Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-background/45 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase font-headline text-muted-foreground">Enrollment</span>
                    <Badge className="bg-white/5 text-muted-foreground border-white/10 uppercase font-headline tracking-[0.16em]">
                      {hydrated && joined ? 'Enlisted' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-2xl font-headline">{hydrated && joined ? 'Room unlocked' : 'Waiting for entry'}</p>
                  <p className="text-sm text-muted-foreground">
                    {hydrated && joined
                      ? 'This challenge is now in your active roster. You can prepare and return at any time.'
                      : 'Join the challenge to unlock a persistent competition room and prep path.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-background/40 p-4">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      Live entrants
                    </p>
                    <p className="text-xl font-headline mt-2">{challenge.participants.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-background/40 p-4">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground flex items-center gap-1.5">
                      <Timer className="w-3 h-3" />
                      Time Left
                    </p>
                    <p className="text-xl font-headline mt-2">{challenge.timeLeft}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-background/40 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground flex items-center gap-1.5">
                      <Wallet className="w-3 h-3" />
                      Readiness
                    </p>
                    <span className="text-[11px] uppercase font-headline text-primary">{joined ? '78%' : '32%'}</span>
                  </div>
                  <Progress value={joined ? 78 : 32} className="h-2 bg-white/5" />
                  <p className="text-sm text-muted-foreground">
                    {joined
                      ? 'You have the room unlocked. Write your answer and submit before the timer ends.'
                      : 'Join first, then read the task and submit one clear answer.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
