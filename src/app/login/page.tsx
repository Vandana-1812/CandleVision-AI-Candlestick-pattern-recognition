
"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, BrainCircuit, ShieldCheck, Sparkles, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: BrainCircuit,
    title: 'AI Signal Intelligence',
    copy: 'Get structured market signal explanations and train your decision process with AI-assisted context.',
  },
  {
    icon: Sparkles,
    title: '3D Market Replay',
    copy: 'Rewind price action candle by candle, practice entries, and learn pattern recognition with immediate feedback.',
  },
  {
    icon: Trophy,
    title: 'Live Challenges',
    copy: 'Compete in focused trading scenarios and benchmark your risk control against community performance ladders.',
  },
  {
    icon: BookOpen,
    title: 'Guided Learning Hub',
    copy: 'Follow a practical curriculum built for beginners and advancing traders with stepwise milestones.',
  },
  {
    icon: ShieldCheck,
    title: 'Risk-First Training',
    copy: 'Simulate realistic trading workflows with position discipline, stop logic, and post-trade review loops.',
  },
  {
    icon: Zap,
    title: 'Performance Insights',
    copy: 'Track win-rate patterns, execution quality, and consistency trends so improvement is measurable over time.',
  },
];

const footerColumns = [
  {
    title: 'Get to Know CandleVision',
    links: ['About Us', 'Careers', 'Newsroom', 'AI Research'],
  },
  {
    title: 'Connect with Us',
    links: ['Community Discord', 'YouTube', 'Instagram', 'X (Twitter)'],
  },
  {
    title: 'Grow with CandleVision',
    links: ['Become a Mentor', 'Partner Program', 'Affiliate Program', 'Team Plans', 'Institutional Access'],
  },
  {
    title: 'Support',
    links: ['Your Account', 'Help Center', 'Safety & Privacy', 'Terms of Use', 'Contact Support'],
  },
];

const footerServices = [
  { name: 'Replay Lab', copy: 'Candlestick playback and drill sessions' },
  { name: 'Signal Lens', copy: 'AI explanations for trade setups' },
  { name: 'Challenge Arena', copy: 'Competitive scenario-based training' },
  { name: 'Learning Hub', copy: 'Structured paths for traders' },
  { name: 'Performance Desk', copy: 'Track consistency and risk metrics' },
  { name: 'Community Rooms', copy: 'Discuss ideas and improve together' },
];

const footerNetwork = [
  { name: 'CandleVision Academy', copy: 'Beginner to advanced trading tracks' },
  { name: 'Quant Studio', copy: 'Scenario testing and strategy drills' },
  { name: 'Audio Briefings', copy: 'Market recap and mindset sessions' },
  { name: 'Trader Spotlight', copy: 'Community stories and progress logs' },
  { name: 'Mentor Desk', copy: 'Live sessions and guided reviews' },
  { name: 'Pro Workspace', copy: 'Tools built for focused practice' },
  { name: 'Prime Signals', copy: 'AI confidence + risk framing' },
  { name: 'Insight Feed', copy: 'News-to-pattern learning summaries' },
];

const footerLegalLinks = ['Conditions of Use', 'Privacy Notice', 'Interest-Based Alerts'];

export default function LoginPage() {
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const cursorTargetRef = useRef({ x: -100, y: -100 });
  const cursorRenderRef = useRef({ x: -100, y: -100 });
  const trailRenderRef = useRef(Array.from({ length: 12 }, () => ({ x: -100, y: -100 })));
  const [trail, setTrail] = useState(Array.from({ length: 12 }, () => ({ x: -100, y: -100 })));
  const [cursorActive, setCursorActive] = useState(false);

  useEffect(() => {
    let frameId = 0;

    const animateCursor = () => {
      const target = cursorTargetRef.current;
      const render = cursorRenderRef.current;

      render.x += (target.x - render.x) * 0.2;
      render.y += (target.y - render.y) * 0.2;

      setCursor({ x: render.x, y: render.y });

      const points = trailRenderRef.current;
      points[0] = { x: render.x, y: render.y };
      for (let i = 1; i < points.length; i += 1) {
        points[i] = {
          x: points[i].x + (points[i - 1].x - points[i].x) * 0.34,
          y: points[i].y + (points[i - 1].y - points[i].y) * 0.34,
        };
      }
      setTrail([...points]);

      frameId = requestAnimationFrame(animateCursor);
    };

    const handleMove = (event: MouseEvent) => {
      cursorTargetRef.current = { x: event.clientX, y: event.clientY };
      const target = event.target as HTMLElement | null;
      setCursorActive(Boolean(target?.closest('a,button,[data-cursor="active"]')));
    };

    frameId = requestAnimationFrame(animateCursor);
    window.addEventListener('mousemove', handleMove);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  return (
    <div className="guest-dashboard relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="guest-noise pointer-events-none absolute inset-0" />
      <div className="guest-grid pointer-events-none absolute inset-0" />
      <div className="guest-orb guest-orb-a" />
      <div className="guest-orb guest-orb-b" />
      <div className="guest-orb guest-orb-c" />

      {trail.map((point, index) => (
        <div
          key={index}
          className="guest-cursor-trail hidden md:block"
          style={{
            transform: `translate3d(${point.x - 4}px, ${point.y - 4}px, 0) scale(${1 - index * 0.055})`,
            opacity: `${Math.max(0.06, 0.84 - index * 0.07)}`,
          }}
        />
      ))}
      <div
        className={`guest-cursor-dot hidden md:block ${cursorActive ? 'guest-cursor-dot-active' : ''}`}
        style={{ transform: `translate3d(${cursor.x - 5}px, ${cursor.y - 5}px, 0)` }}
      />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-24 pt-8 md:gap-20 md:px-10 md:pt-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-[0_0_20px_rgba(42,90,159,0.55)]">
              <Zap className="h-5 w-5 fill-current text-white" />
            </div>
            <div>
              <p className="font-headline text-xl font-bold tracking-tight text-white">
                CANDLE<span className="text-primary">VISION</span>
              </p>
              <p className="font-headline text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                AI Trading Simulator Platform
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/10" data-cursor="active">
              <Link href="/auth?mode=signup">Create account</Link>
            </Button>
            <Button asChild className="bg-primary text-white hover:bg-primary/80" data-cursor="active">
              <Link href="/auth">
                Sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_380px]">
          <div className="space-y-6">
            <Badge className="border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-headline uppercase tracking-[0.2em] text-primary hover:bg-primary/20">
              Unsigned Dashboard
            </Badge>
            <h1 className="max-w-4xl font-headline text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
              Learn, Practice, and Evolve Your Trading Edge Before You Place Real Capital
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              CandleVision is a simulation-first platform for traders who want structure. Explore replay sessions, AI-guided signals,
              challenge arenas, and disciplined risk workflows designed to build skill and confidence.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-primary/20 bg-card/50 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-xs uppercase tracking-[0.22em] text-muted-foreground">Users train on</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-headline text-3xl text-white">Replay</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-card/50 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-xs uppercase tracking-[0.22em] text-muted-foreground">Core pillars</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-headline text-3xl text-white">6</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-card/50 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-xs uppercase tracking-[0.22em] text-muted-foreground">Mode</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-headline text-3xl text-white">Simulated</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-primary/25 bg-card/55 backdrop-blur-md">
            <CardHeader className="space-y-3">
              <CardTitle className="font-headline text-2xl text-white">Why start here?</CardTitle>
              <p className="text-sm leading-7 text-muted-foreground">
                This guest view is your quick orientation. Enter the platform once you are ready to track progress, save sessions,
                and compete on the full dashboard.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-background/40 p-4">
                <p className="font-headline text-xs uppercase tracking-[0.2em] text-primary">What you unlock after sign in</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>Persistent trading stats and history</li>
                  <li>Personalized AI learning suggestions</li>
                  <li>Competition rankings and challenge progress</li>
                </ul>
              </div>
              <Button asChild className="w-full bg-primary text-white hover:bg-primary/80" data-cursor="active">
                <Link href="/auth">Continue to Secure Access</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-2xl text-white md:text-3xl">Visual Proof of Product Experience</h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Reserved blocks for screenshots or product mockups. Drop your images in these slots to showcase replay,
                competitions, and analytics.
              </p>
            </div>
            <Badge variant="outline" className="hidden border-primary/30 text-primary md:inline-flex">
              Image-ready layout
            </Badge>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Card className="group border-primary/25 bg-card/45 p-3 backdrop-blur-md">
              <div className="image-slot relative aspect-[16/10] overflow-hidden rounded-xl border border-dashed border-primary/35 bg-background/55">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(42,90,159,0.35),transparent_35%),linear-gradient(165deg,#09111e_0%,#111b2a_42%,#171822_100%)]" />
                <div className="absolute left-4 right-4 top-4 rounded-lg border border-slate-600/35 bg-[#0B1422]/82 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-headline text-[10px] uppercase tracking-[0.2em] text-slate-200">Market Dashboard</p>
                    <span className="rounded-full border border-orange-400/45 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-orange-300">Live</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-9 rounded-md bg-slate-800/70" />
                    <div className="h-9 rounded-md bg-slate-800/70" />
                    <div className="h-9 rounded-md bg-slate-800/70" />
                  </div>
                </div>
                <div className="absolute bottom-12 left-4 right-4 top-24 rounded-xl border border-purple-500/20 bg-[#0B1521]/78 p-3">
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 360" fill="none" preserveAspectRatio="none">
                    <path d="M20 250 C110 245, 130 170, 220 178 C300 184, 360 255, 450 225 C540 196, 620 130, 700 154 C770 175, 820 210, 880 170" stroke="#fb923c" strokeWidth="4" strokeLinecap="round" />
                    <path d="M20 265 C95 225, 160 248, 240 220 C320 194, 400 116, 490 145 C560 167, 640 205, 720 180 C795 157, 840 110, 880 122" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.85" />
                  </svg>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
                  <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-white/90">Hero platform visual</p>
                </div>
              </div>
            </Card>

            <Card className="group border-primary/25 bg-card/45 p-3 backdrop-blur-md">
              <div className="image-slot relative aspect-[16/10] overflow-hidden rounded-xl border border-dashed border-primary/35 bg-background/55">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_28%,rgba(249,115,22,0.2),transparent_26%),linear-gradient(160deg,#08101d_0%,#101a27_55%,#141926_100%)]" />
                <div className="absolute inset-4 rounded-lg border border-slate-500/30 bg-slate-950/60 p-3">
                  <p className="font-headline text-[10px] uppercase tracking-[0.18em] text-slate-200">Replay timeline</p>
                  <div className="mt-3 flex h-[calc(100%-34px)] items-end gap-1.5">
                    <span className="h-10 w-1.5 rounded bg-orange-300/80" />
                    <span className="h-16 w-1.5 rounded bg-blue-300/90" />
                    <span className="h-11 w-1.5 rounded bg-orange-300/80" />
                    <span className="h-20 w-1.5 rounded bg-blue-300/90" />
                    <span className="h-14 w-1.5 rounded bg-orange-300/80" />
                    <span className="h-24 w-1.5 rounded bg-blue-300/90" />
                    <span className="h-[4.25rem] w-1.5 rounded bg-slate-200/90" />
                  </div>
                  <div className="absolute right-8 top-16 rounded-full border border-orange-400/55 bg-[#1f2b3b]/80 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-orange-300">Focus</div>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
                  <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-white/90">Replay visual</p>
                </div>
              </div>
            </Card>

            <Card className="group border-primary/25 bg-card/45 p-3 backdrop-blur-md">
              <div className="image-slot relative aspect-[16/10] overflow-hidden rounded-xl border border-dashed border-primary/35 bg-background/55">
                <div className="absolute inset-0 bg-[linear-gradient(160deg,#151823_0%,#101624_55%,#0D1119_100%)]" />
                <div className="absolute inset-4 grid grid-cols-[1fr_0.8fr] gap-3">
                  <div className="rounded-lg border border-slate-600/35 bg-slate-900/60 p-3">
                    <p className="font-headline text-[10px] uppercase tracking-[0.18em] text-slate-200">Leaderboard</p>
                    <div className="mt-2 space-y-2">
                      <div className="h-5 rounded bg-blue-500/35" />
                      <div className="h-5 rounded bg-purple-400/20" />
                      <div className="h-5 rounded bg-orange-400/30" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-600/35 bg-slate-900/60 p-3">
                    <p className="font-headline text-[10px] uppercase tracking-[0.18em] text-slate-200">Score trend</p>
                    <div className="mt-4 h-[72%] rounded bg-[linear-gradient(180deg,rgba(168,85,247,0.26),rgba(30,41,59,0.08))]" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
                  <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-white/90">Competition visual</p>
                </div>
              </div>
            </Card>

            <Card className="group border-primary/25 bg-card/45 p-3 backdrop-blur-md">
              <div className="image-slot relative aspect-[16/10] overflow-hidden rounded-xl border border-dashed border-primary/35 bg-background/55">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(139,92,246,0.25),transparent_32%),linear-gradient(160deg,#161322_0%,#1a1a2b_45%,#111827_100%)]" />
                <div className="absolute inset-4 rounded-lg border border-purple-400/25 bg-slate-900/55 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-headline text-[10px] uppercase tracking-[0.18em] text-slate-200">AI Explainability</p>
                    <span className="rounded-full border border-purple-400/40 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-purple-300">Insights</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border border-slate-600/35 bg-slate-800/60 p-3 text-[10px] text-slate-300">Pattern confidence: 84%</div>
                    <div className="rounded-md border border-slate-600/35 bg-slate-800/60 p-3 text-[10px] text-slate-300">Risk signal: Medium</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-700/60">
                    <div className="h-2 w-[72%] rounded-full bg-[linear-gradient(90deg,#fb923c,#7b5f8f)]" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
                  <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-white/90">AI explanation visual</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group border-primary/20 bg-card/45 transition-colors hover:border-primary/45 hover:bg-card/70">
              <CardHeader className="space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle className="font-headline text-xl text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-muted-foreground">{feature.copy}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="relative left-1/2 right-1/2 z-10 mt-6 w-screen -translate-x-1/2 border-t border-primary/15 bg-[#243449]/85">
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title} className="space-y-3">
                <h3 className="font-headline text-lg font-semibold text-white">{column.title}</h3>
                <ul className="space-y-2 text-sm text-slate-200/90">
                  {column.links.map((link) => (
                    <li key={link}>
                      <Link href="/auth" className="transition-colors hover:text-primary" data-cursor="active">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-7">
            <p className="font-headline text-2xl font-semibold tracking-tight text-white">
              CANDLE<span className="text-primary">VISION</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="rounded border border-white/25 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-primary/70 hover:text-white" data-cursor="active">
                Language: English
              </button>
              <button className="rounded border border-white/25 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-primary/70 hover:text-white" data-cursor="active">
                Region: Global
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#131d2b]/95">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-3 md:px-10">
            {footerServices.map((service) => (
              <div key={service.name}>
                <p className="font-headline text-base text-white">{service.name}</p>
                <p className="text-sm text-slate-300/90">{service.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#0b1624]">
          <div className="mx-auto max-w-7xl px-6 py-9 md:px-10">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {footerNetwork.map((item) => (
                <div key={item.name}>
                  <p className="font-headline text-base text-white">{item.name}</p>
                  <p className="text-sm leading-6 text-slate-300/85">{item.copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-white/10 pt-6 text-center">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-200/90">
                {footerLegalLinks.map((link) => (
                  <Link key={link} href="/auth" className="transition-colors hover:text-primary" data-cursor="active">
                    {link}
                  </Link>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-300/75">© 2026 CandleVision Labs. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
