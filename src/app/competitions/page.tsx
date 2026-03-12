"use client"

import React from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Users, Timer, Target, Medal } from 'lucide-react';

const leaderboard = [
  { rank: 1, operator: "Cypher_X", pnl: "+124.5%", trades: 142, score: 9850 },
  { rank: 2, operator: "NeonTracer", pnl: "+88.2%", trades: 98, score: 8420 },
  { rank: 3, operator: "VoidWalker", pnl: "+76.4%", trades: 215, score: 7910 },
  { rank: 4, operator: "BitGhost", pnl: "+62.1%", trades: 56, score: 6200 },
  { rank: 5, operator: "QuantumDev", pnl: "+45.8%", trades: 112, score: 5400 },
];

export default function CompetitionsPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold glow-blue">OPERATIVE TOURNAMENTS</h1>
          <p className="text-muted-foreground font-body">Global trading challenges for top-tier analysts.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="holographic-card lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="font-headline text-lg glow-blue uppercase">Global Leaderboard</CardTitle>
                <p className="text-xs text-muted-foreground font-body">Season 4: The Great Divergence</p>
              </div>
              <Medal className="w-8 h-8 text-primary opacity-50" />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/10">
                    <TableHead className="font-headline text-xs uppercase text-muted-foreground w-16">Rank</TableHead>
                    <TableHead className="font-headline text-xs uppercase text-muted-foreground">Operator ID</TableHead>
                    <TableHead className="font-headline text-xs uppercase text-muted-foreground">PnL %</TableHead>
                    <TableHead className="font-headline text-xs uppercase text-muted-foreground">Trades</TableHead>
                    <TableHead className="font-headline text-xs uppercase text-muted-foreground text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((user) => (
                    <TableRow key={user.rank} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-headline font-bold">
                        <span className={user.rank <= 3 ? "text-primary glow-blue" : "text-muted-foreground"}>
                          #{user.rank}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{user.operator}</TableCell>
                      <TableCell className="text-accent font-headline">{user.pnl}</TableCell>
                      <TableCell className="text-muted-foreground">{user.trades}</TableCell>
                      <TableCell className="text-right font-headline font-bold">{user.score.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="holographic-card border-primary/40 bg-primary/5">
              <CardHeader>
                <CardTitle className="font-headline text-sm uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  Active Challenge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-background/50 border border-white/10">
                  <p className="text-xs font-headline text-muted-foreground uppercase mb-1">Challenge Name</p>
                  <p className="text-lg font-bold tracking-tight">Alpha Extraction: BTC/USDT</p>
                </div>
                <div className="flex items-center justify-between text-xs font-headline">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-3 h-3" />
                    1,240 OPERATORS
                  </div>
                  <div className="flex items-center gap-1.5 text-destructive">
                    <Timer className="w-3 h-3" />
                    22:14:05 LEFT
                  </div>
                </div>
                <button className="w-full py-3 rounded-lg bg-primary hover:bg-primary/80 text-white font-headline text-xs transition-all shadow-[0_0_15px_rgba(42,90,159,0.5)]" suppressHydrationWarning>
                  JOIN OPERATIVE
                </button>
              </CardContent>
            </Card>

            <Card className="holographic-card">
              <CardHeader>
                <CardTitle className="font-headline text-sm uppercase">Your Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex justify-between items-end border-b border-white/5 pb-2">
                   <div className="space-y-1">
                      <p className="text-[10px] font-headline text-muted-foreground uppercase">Current Rank</p>
                      <p className="text-xl font-bold">#4,281</p>
                   </div>
                   <Target className="w-5 h-5 text-accent mb-1" />
                 </div>
                 <div className="pt-2">
                    <p className="text-[10px] font-headline text-muted-foreground uppercase mb-1">To Next Tier</p>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-2/3" />
                    </div>
                    <p className="text-[10px] mt-2 text-right text-primary font-headline">1,400 PTS REQUIRED</p>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
