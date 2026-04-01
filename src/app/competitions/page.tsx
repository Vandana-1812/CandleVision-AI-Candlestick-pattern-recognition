"use client"

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useCompetitionRoster } from '@/hooks/use-competition-roster';
import { useUser } from '@/firebase';
import {
  ArrowUpRight,
  Crown,
  Flame,
  Radar,
  ShieldCheck,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  Users,
} from 'lucide-react';

type LeaderboardRow = {
  rank: number;
  userId: string;
  operator: string;
  score: number;
  pnlPercent: number;
  trades: number;
  streak: number;
  badge: string;
};

type CompetitionChallenge = {
  id: string;
  name: string;
  style: string;
  participants: number;
  reward: string;
  timeLeft: string;
  difficulty: string;
  focus: string;
  symbol: string;
  format: string;
  objective: string;
  duration: string;
  task: string;
  deliverables: string[];
  evaluation: string[];
};

const missionLog = [
  { title: 'Finish Top 25%', progress: 74, reward: '+750 pts' },
  { title: 'Close 5 Profitable Trades', progress: 60, reward: 'Risk Badge' },
  { title: 'Maintain Drawdown Under 3%', progress: 88, reward: 'Shield Crest' },
];

const seasonSnapshot = [
  { label: 'Division', value: 'Tier B', hint: 'Promotion threshold in range' },
  { label: 'Best Streak', value: '6 wins', hint: 'Peak run this season' },
  { label: 'Cutline', value: 'Top 25%', hint: 'Needed for season reward crate' },
  { label: 'Season Ends', value: '11 days', hint: 'March 31, 2026 close' },
];

const duelFeed = [
  { opponent: 'MacroRift', arena: 'BTC Sprint', outcome: 'Won +18 pts', time: '12m ago' },
  { opponent: 'AtlasDelta', arena: 'Macro Gauntlet', outcome: 'Lost -6 pts', time: '47m ago' },
  { opponent: 'SilverTape', arena: 'Stealth Ladder', outcome: 'Won +9 pts', time: '1h ago' },
];

const rewardTiers = [
  { tier: 'Bronze', score: '2,000+', perk: 'Season badge and challenge archive access' },
  { tier: 'Silver', score: '4,500+', perk: 'Replay packs and ranked squad rooms' },
  { tier: 'Gold', score: '7,500+', perk: 'Elite challenge invites and operator frame' },
];

function getRankTone(rank: number) {
  if (rank === 1) return 'text-yellow-300';
  if (rank === 2) return 'text-slate-200';
  if (rank === 3) return 'text-orange-300';
  return 'text-muted-foreground';
}

export default function CompetitionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [rankedQueueActive, setRankedQueueActive] = React.useState(false);
  const [squadRoomReady, setSquadRoomReady] = React.useState(false);
  const [leaderboardRows, setLeaderboardRows] = React.useState<LeaderboardRow[]>([]);
  const [tierRows, setTierRows] = React.useState<LeaderboardRow[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = React.useState(true);
  const [leaderboardError, setLeaderboardError] = React.useState<string | null>(null);
  const [challenges, setChallenges] = React.useState<CompetitionChallenge[]>([]);
  const [challengesLoading, setChallengesLoading] = React.useState(true);
  const [challengesError, setChallengesError] = React.useState<string | null>(null);
  const { hydrated, joinedChallenges, isJoined, joinChallenge } = useCompetitionRoster();

  React.useEffect(() => {
    const loadLeaderboard = async () => {
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      try {
        const query = user?.uid ? `?userId=${encodeURIComponent(user.uid)}` : '';
        const response = await fetch(`/api/competitions/leaderboard${query}`);
        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          setLeaderboardError(errorData.error || 'Failed to load leaderboard');
          setLeaderboardRows([]);
          setTierRows([]);
          return;
        }
        const payload = (await response.json()) as { leaderboard?: LeaderboardRow[]; tier?: LeaderboardRow[] };
        if (Array.isArray(payload.leaderboard)) {
          setLeaderboardRows(payload.leaderboard);
        }
        if (Array.isArray(payload.tier)) {
          setTierRows(payload.tier);
        }
      } catch {
        setLeaderboardError('Network error loading leaderboard');
        setLeaderboardRows([]);
        setTierRows([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    void loadLeaderboard();
  }, [user?.uid]);

  React.useEffect(() => {
    const loadChallenges = async () => {
      setChallengesLoading(true);
      setChallengesError(null);
      try {
        const response = await fetch('/api/competitions/challenges');
        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          setChallengesError(errorData.error || 'Failed to load challenges');
          setChallenges([]);
          return;
        }
        const payload = (await response.json()) as { challenges?: CompetitionChallenge[] };
        if (Array.isArray(payload.challenges)) {
          setChallenges(payload.challenges);
        }
      } catch {
        setChallengesError('Network error loading challenges');
        setChallenges([]);
      } finally {
        setChallengesLoading(false);
      }
    };

    void loadChallenges();
  }, []);

  const joinedChallengeCards = challenges.filter((challenge) => joinedChallenges.includes(challenge.id));

  const handleRankedQueue = () => {
    const next = !rankedQueueActive;
    setRankedQueueActive(next);

    toast({
      title: next ? 'Ranked queue armed' : 'Ranked queue paused',
      description: next
        ? 'You are now queued for the next sprint-matched competition room.'
        : 'You have stepped out of the ranked queue for now.',
    });
  };

  const handleRuleset = () => {
    toast({
      title: 'Competition ruleset',
      description: 'Paper capital only, drawdown is tracked, and seasonal score updates every 15 minutes.',
    });
  };

  const handleSquadRoom = () => {
    const next = !squadRoomReady;
    setSquadRoomReady(next);

    toast({
      title: next ? 'Squad room created' : 'Squad room archived',
      description: next
        ? 'Invite links are ready for private challenge sessions.'
        : 'Your temporary squad room has been closed.',
    });
  };

  const handleJoinChallenge = (challengeName: string, challengeId: string) => {
    if (isJoined(challengeId)) {
      toast({
        title: 'Already enlisted',
        description: `You are already registered for ${challengeName}.`,
      });

      router.push(`/competitions/${challengeId}`);
      return;
    }

    joinChallenge(challengeId);

    toast({
      title: 'Challenge joined',
      description: `${challengeName} room is ready. Opening your competition terminal now.`,
    });

    router.push(`/competitions/${challengeId}`);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 uppercase font-headline tracking-[0.2em]">
              Season 4 live
            </Badge>
            <Badge className="bg-accent/10 text-accent border-accent/20 px-3 py-1 uppercase font-headline tracking-[0.18em]">
              8,642 operators active
            </Badge>
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold glow-blue">OPERATIVE TOURNAMENTS</h1>
            <p className="text-muted-foreground font-body max-w-3xl">
              Enter live paper-trading leagues, climb seasonal ladders, and sharpen execution under pressure without risking real capital.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_420px] gap-6 items-start">
          <div className="space-y-6">
            <Card className="holographic-card border-primary/20 overflow-hidden">
              <CardHeader className="border-b border-white/5 pb-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2">
                    <CardTitle className="font-headline text-lg uppercase glow-blue flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      My Active Challenges
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Joined challenges become real rooms you can enter and manage from here.
                    </p>
                  </div>
                  <Badge className="bg-white/5 text-muted-foreground border-white/10 uppercase font-headline tracking-[0.18em]">
                    {hydrated ? `${joinedChallengeCards.length} joined` : 'syncing roster'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {hydrated && joinedChallengeCards.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {joinedChallengeCards.map((challenge) => (
                      <div key={challenge.id} className="rounded-2xl border border-primary/20 bg-primary/8 p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase font-headline tracking-[0.18em] text-primary">{challenge.style}</p>
                            <h3 className="font-headline text-lg mt-2">{challenge.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{challenge.objective}</p>
                          </div>
                          <Badge className="bg-accent/10 text-accent border-accent/20 uppercase font-headline tracking-[0.16em]">
                            Active
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                            <p className="text-[10px] uppercase font-headline text-muted-foreground">Format</p>
                            <p className="font-headline mt-1">{challenge.format}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                            <p className="text-[10px] uppercase font-headline text-muted-foreground">Session</p>
                            <p className="font-headline mt-1">{challenge.duration}</p>
                          </div>
                        </div>
                        <Button asChild className="w-full font-headline uppercase text-xs bg-accent text-black hover:bg-accent/80">
                          <Link href={`/competitions/${challenge.id}`}>Enter challenge room</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-background/35 p-6 text-sm text-muted-foreground">
                    Join one of the live challenges below and it will appear here as a real competition room you can enter anytime.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="holographic-card border-primary/25 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
              <CardHeader className="border-b border-white/5 pb-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2">
                    <CardTitle className="font-headline text-lg uppercase glow-blue flex items-center gap-2">
                      <Radar className="w-5 h-5 text-primary" />
                      Season Command Deck
                    </CardTitle>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                      You are inside the active operator ladder. Push score, protect drawdown, and stay above the seasonal cutline.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={handleRankedQueue}
                      className={`font-headline uppercase text-xs ${
                        rankedQueueActive
                          ? 'bg-primary text-white hover:bg-primary/80'
                          : 'bg-accent text-black hover:bg-accent/80'
                      }`}
                    >
                      {rankedQueueActive ? 'Leave ranked queue' : 'Enter ranked queue'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRuleset}
                      className="font-headline uppercase text-xs border-white/10 bg-white/[0.03]"
                    >
                      View ruleset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {seasonSnapshot.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-background/45 p-4 space-y-2">
                      <p className="text-[10px] uppercase font-headline tracking-[0.18em] text-muted-foreground">{item.label}</p>
                      <p className="text-2xl font-headline">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.hint}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-4">
                  <div className="rounded-2xl border border-white/10 bg-background/40 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase font-headline tracking-[0.18em] text-muted-foreground">Season Momentum</p>
                        <p className="font-headline text-lg">72% toward Gold Tier promotion</p>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
                    </div>
                    <Progress value={72} className="h-2 bg-white/5" />
                    <div className="flex items-center justify-between text-[11px] uppercase font-headline text-muted-foreground">
                      <span>Current Score: 3,480</span>
                      <span className="text-primary">420 points remaining</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-background/40 p-4 space-y-2">
                    <p className="text-[10px] uppercase font-headline tracking-[0.18em] text-muted-foreground">Operator Advisory</p>
                    <p className="font-medium">Your consistency is strong enough for ranked sprint entries.</p>
                    <p className="text-sm text-muted-foreground">
                      Best opportunity: short-duration BTC arenas where low drawdown matters as much as raw PnL.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="holographic-card border-primary/20 overflow-hidden">
              <CardHeader className="border-b border-white/5 pb-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2">
                    <CardTitle className="font-headline text-lg uppercase glow-blue flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Live Challenges
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Pick a short live task, solve it fast, and enter the room with a clear answer.
                    </p>
                  </div>
                  <Button
                    onClick={handleSquadRoom}
                    className={`font-headline uppercase text-xs ${
                      squadRoomReady
                        ? 'bg-accent text-black hover:bg-accent/80'
                        : 'bg-primary hover:bg-primary/80 text-white'
                    }`}
                  >
                    {squadRoomReady ? 'Squad room ready' : 'Create squad room'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {challengesLoading ? (
                  <div className="rounded-2xl border border-white/10 bg-background/50 p-8 text-center text-muted-foreground">
                    <p className="font-headline text-sm uppercase">Loading challenges...</p>
                  </div>
                ) : challengesError ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6">
                    <p className="font-headline text-sm uppercase text-destructive">Challenges unavailable</p>
                    <p className="text-sm text-muted-foreground mt-2">{challengesError}</p>
                  </div>
                ) : challenges.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-background/50 p-8 text-center text-muted-foreground">
                    <p className="font-headline text-sm uppercase">No active challenges</p>
                    <p className="text-sm mt-2">Check back soon for new competition challenges.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {challenges.map((challenge, index) => (
                      <div
                        key={challenge.id}
                        className={`rounded-2xl border p-5 space-y-4 bg-gradient-to-br ${
                          isJoined(challenge.id)
                            ? 'from-accent/10 via-background to-background border-accent/30'
                            : index === 0
                            ? 'from-primary/12 via-background to-background border-primary/25'
                            : 'from-white/[0.03] to-background border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <Badge className="bg-white/5 text-muted-foreground border-white/10 uppercase font-headline tracking-[0.18em]">
                              {challenge.style}
                            </Badge>
                            <div>
                              <h3 className="font-headline text-lg leading-tight">{challenge.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{challenge.focus}</p>
                            </div>
                          </div>
                          <Flame className="w-5 h-5 text-accent shrink-0" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl bg-background/50 border border-white/10 p-3">
                            <p className="text-[10px] uppercase font-headline text-muted-foreground">Reward</p>
                            <p className="font-headline text-lg">{challenge.reward}</p>
                          </div>
                          <div className="rounded-xl bg-background/50 border border-white/10 p-3">
                            <p className="text-[10px] uppercase font-headline text-muted-foreground">Difficulty</p>
                            <p className="font-headline text-lg">{challenge.difficulty}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-headline uppercase text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3 h-3" />
                            {challenge.participants.toLocaleString()} live
                          </span>
                          <span className="flex items-center gap-1.5 text-destructive">
                            <Timer className="w-3 h-3" />
                            {challenge.timeLeft}
                          </span>
                        </div>

                        <Button
                          onClick={() => handleJoinChallenge(challenge.name, challenge.id)}
                          className={`w-full font-headline text-xs uppercase ${
                            isJoined(challenge.id)
                              ? 'bg-accent text-black hover:bg-accent/80'
                              : index === 0
                              ? 'bg-accent text-black hover:bg-accent/80'
                              : 'bg-primary hover:bg-primary/80 text-white'
                          }`}
                        >
                          {isJoined(challenge.id) ? 'Enter challenge' : 'Join challenge'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="holographic-card border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <CardTitle className="font-headline text-lg uppercase glow-blue flex items-center gap-2">
                      <Crown className="w-5 h-5 text-primary" />
                      Leaderboards
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Track the strongest operators across the current season.</p>
                  </div>
                  <Badge className="bg-white/5 text-muted-foreground border-white/10 uppercase font-headline tracking-[0.18em]">
                    Updates every 15 min
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs defaultValue="global" className="space-y-4">
                  <TabsList className="bg-background/50 border border-white/10 h-auto p-1">
                    <TabsTrigger value="global" className="font-headline uppercase text-xs">Global</TabsTrigger>
                    <TabsTrigger value="friends" className="font-headline uppercase text-xs">Your tier</TabsTrigger>
                  </TabsList>

                  <TabsContent value="global">
                    {leaderboardLoading ? (
                      <div className="rounded-2xl border border-white/10 bg-background/50 p-8 text-center text-muted-foreground">
                        <p className="font-headline text-sm uppercase">Loading leaderboard...</p>
                      </div>
                    ) : leaderboardError ? (
                      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6">
                        <p className="font-headline text-sm uppercase text-destructive">Leaderboard unavailable</p>
                        <p className="text-sm text-muted-foreground mt-2">{leaderboardError}</p>
                        <Button 
                          onClick={() => void (async () => {
                            setLeaderboardLoading(true);
                            setLeaderboardError(null);
                            try {
                              const query = user?.uid ? `?userId=${encodeURIComponent(user.uid)}` : '';
                              const response = await fetch(`/api/competitions/leaderboard${query}`);
                              if (!response.ok) {
                                const errorData = (await response.json()) as { error?: string };
                                setLeaderboardError(errorData.error || 'Failed to load leaderboard');
                                setLeaderboardRows([]);
                                setTierRows([]);
                                return;
                              }
                              const payload = (await response.json()) as { leaderboard?: LeaderboardRow[]; tier?: LeaderboardRow[] };
                              if (Array.isArray(payload.leaderboard)) setLeaderboardRows(payload.leaderboard);
                              if (Array.isArray(payload.tier)) setTierRows(payload.tier);
                            } catch {
                              setLeaderboardError('Network error loading leaderboard');
                            } finally {
                              setLeaderboardLoading(false);
                            }
                          })()}
                          className="mt-4 font-headline text-xs uppercase"
                          variant="outline"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : leaderboardRows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-background/50 p-8 text-center text-muted-foreground">
                        <p className="font-headline text-sm uppercase">No submissions yet</p>
                        <p className="text-sm mt-2">Join a challenge and complete it to appear on the leaderboard.</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-white/10">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/10 bg-white/[0.02]">
                              <TableHead className="w-16 font-headline text-xs uppercase text-muted-foreground">Rank</TableHead>
                              <TableHead className="font-headline text-xs uppercase text-muted-foreground">Operator</TableHead>
                              <TableHead className="font-headline text-xs uppercase text-muted-foreground">PnL</TableHead>
                              <TableHead className="font-headline text-xs uppercase text-muted-foreground">Streak</TableHead>
                              <TableHead className="font-headline text-xs uppercase text-muted-foreground">Trades</TableHead>
                              <TableHead className="text-right font-headline text-xs uppercase text-muted-foreground">Score</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leaderboardRows.map((row) => (
                              <TableRow key={row.rank} className="border-white/5 hover:bg-white/5">
                                <TableCell className="font-headline font-bold">
                                  <span className={getRankTone(row.rank)}>#{row.rank}</span>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <p className="font-medium">{row.operator}</p>
                                    <Badge className="bg-white/5 text-muted-foreground border-white/10 uppercase font-headline tracking-[0.16em]">
                                      {row.badge}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="font-headline text-accent">{`${row.pnlPercent >= 0 ? '+' : ''}${row.pnlPercent.toFixed(1)}%`}</TableCell>
                                <TableCell className="text-muted-foreground">{row.streak} wins</TableCell>
                                <TableCell className="text-muted-foreground">{row.trades}</TableCell>
                                <TableCell className="text-right font-headline font-bold">{row.score.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="friends">
                    {leaderboardLoading ? (
                      <div className="rounded-2xl border border-white/10 bg-background/50 p-8 text-center text-muted-foreground">
                        <p className="font-headline text-sm uppercase">Loading your tier...</p>
                      </div>
                    ) : leaderboardError ? (
                      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6">
                        <p className="font-headline text-sm uppercase text-destructive">Tier data unavailable</p>
                        <p className="text-sm text-muted-foreground mt-2">{leaderboardError}</p>
                      </div>
                    ) : tierRows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-background/50 p-8 text-center text-muted-foreground">
                        <p className="font-headline text-sm uppercase">No rank data available</p>
                        <p className="text-sm mt-2">Complete a challenge to see your tier standings.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tierRows.map((row) => (
                          <div
                            key={row.rank}
                            className={`rounded-2xl border p-4 ${
                              row.userId === user?.uid
                                ? 'border-primary/25 bg-primary/8'
                                : 'border-white/10 bg-white/[0.02]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] uppercase font-headline text-muted-foreground">Rank #{row.rank}</p>
                                <p className="text-lg font-headline mt-1">{row.operator}</p>
                              </div>
                              <ArrowUpRight
                                className={`w-5 h-5 ${row.userId === user?.uid ? 'text-primary' : 'text-accent'}`}
                              />
                            </div>
                            <div className="mt-4 flex items-end justify-between">
                              <div>
                                <p className="text-[10px] uppercase font-headline text-muted-foreground">PnL</p>
                                <p className="text-xl font-headline text-accent">
                                  {`${row.pnlPercent >= 0 ? '+' : ''}${row.pnlPercent.toFixed(1)}%`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] uppercase font-headline text-muted-foreground">Score</p>
                                <p className="text-lg font-headline">{row.score.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="holographic-card border-primary/30 bg-gradient-to-br from-primary/10 to-background">
              <CardHeader>
                <CardTitle className="font-headline text-sm uppercase flex items-center gap-2">
                  <Radar className="w-4 h-4 text-primary" />
                  Your Competition Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-background/50 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase font-headline text-muted-foreground">Current season rank</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-headline">Tier B</Badge>
                  </div>
                  <p className="text-3xl font-headline font-bold">#4,281</p>
                  <p className="text-sm text-muted-foreground">You are outperforming 51% of active operators this season.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-background/40 p-4">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Season Score</p>
                    <p className="text-2xl font-headline mt-1">3,480</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-background/40 p-4">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Best Finish</p>
                    <p className="text-2xl font-headline mt-1 text-accent">#312</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-background/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase font-headline text-muted-foreground">Next promotion</p>
                      <p className="font-headline text-lg">Operator Gold Tier</p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-accent" />
                  </div>
                  <Progress value={72} className="h-2 bg-white/5" />
                  <p className="text-[11px] text-right font-headline uppercase text-primary">420 points remaining</p>
                </div>
              </CardContent>
            </Card>

            <Card className="holographic-card border-primary/20">
              <CardHeader>
                <CardTitle className="font-headline text-sm uppercase flex items-center gap-2">
                  <Swords className="w-4 h-4 text-primary" />
                  Mission Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {missionLog.map((mission) => (
                  <div key={mission.title} className="rounded-2xl border border-white/10 bg-background/35 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{mission.title}</p>
                        <p className="text-[10px] uppercase font-headline text-muted-foreground mt-1">Reward: {mission.reward}</p>
                      </div>
                      <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    </div>
                    <Progress value={mission.progress} className="h-2 bg-white/5" />
                    <p className="text-[11px] text-right uppercase font-headline text-primary">{mission.progress}% complete</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="holographic-card border-primary/20">
              <CardHeader>
                <CardTitle className="font-headline text-sm uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Reward Tiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rewardTiers.map((reward) => (
                  <div key={reward.tier} className="rounded-2xl border border-white/10 bg-background/35 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-headline text-lg">{reward.tier}</p>
                        <p className="text-[10px] uppercase font-headline tracking-[0.16em] text-primary mt-1">
                          {reward.score}
                        </p>
                      </div>
                      <Badge className="bg-white/5 text-muted-foreground border-white/10 uppercase font-headline tracking-[0.16em]">
                        Seasonal
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">{reward.perk}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="holographic-card border-primary/20">
              <CardHeader>
                <CardTitle className="font-headline text-sm uppercase flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-primary" />
                  Duel Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {duelFeed.map((duel) => (
                  <div key={`${duel.opponent}-${duel.time}`} className="rounded-2xl border border-white/10 bg-background/35 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{duel.opponent}</p>
                        <p className="text-[10px] uppercase font-headline tracking-[0.16em] text-muted-foreground mt-1">
                          {duel.arena}
                        </p>
                      </div>
                      <p className="text-[10px] uppercase font-headline tracking-[0.16em] text-muted-foreground">{duel.time}</p>
                    </div>
                    <p className="font-headline text-base mt-3 text-accent">{duel.outcome}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
