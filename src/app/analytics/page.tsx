"use client"

import React, { useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Target, ShieldCheck } from 'lucide-react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { user } = useUser();
  const db = useFirestore();

  const signalsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'signals'), orderBy('timestamp', 'desc'), limit(100));
  }, [db, user]);

  const { data: signals } = useCollection(signalsQuery);

  const metrics = useMemo(() => {
    if (!signals || signals.length === 0) {
      return { sharpe: 0, profitFactor: null as number | null, drawdown: 0, expectancy: 0 };
    }

    const verified = signals.filter((s: any) => s.isVerified && s.profitLoss != null);
    if (verified.length === 0) return { sharpe: 0, profitFactor: null as number | null, drawdown: 0, expectancy: 0 };

    const pnls: number[] = verified.map((s: any) => s.profitLoss as number);

    // Sharpe Ratio (annualised assuming ~8760 hourly signal periods per year)
    const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
    const variance = pnls.reduce((acc, v) => acc + (v - mean) ** 2, 0) / pnls.length;
    const std = Math.sqrt(variance);
    const sharpe = std > 0 ? parseFloat(((mean / std) * Math.sqrt(8760)).toFixed(2)) : 0;

    // Profit Factor = gross profit / gross loss
    const grossProfit = pnls.filter((v) => v > 0).reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(pnls.filter((v) => v < 0).reduce((a, b) => a + b, 0));
    const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? Infinity : 0;
    // Max drawdown
    let balance = 10000;
    let peak = balance;
    let maxDrawdown = 0;
    for (const pnl of [...pnls].reverse()) {
      balance += pnl;
      if (balance > peak) peak = balance;
      const dd = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Expectancy = (win rate × avg win) - (loss rate × avg loss)
    const wins = pnls.filter((v) => v > 0);
    const losses = pnls.filter((v) => v < 0);
    const winRate = wins.length / pnls.length;
    const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;
    const expectancy = parseFloat((winRate * avgWin - (1 - winRate) * avgLoss).toFixed(2));

    return {
      sharpe,
      profitFactor: isFinite(profitFactor) ? profitFactor : null,
      drawdown: parseFloat(maxDrawdown.toFixed(2)),
      expectancy,
    };
  }, [signals]);

  const chartData = useMemo(() => {
    if (!signals) return [];
    let balance = 10000;
    return [...signals].reverse().map((s: any, i: number) => {
      balance += s.profitLoss || 0;
      return { name: i + 1, balance };
    });
  }, [signals]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold glow-blue">ADVANCED ANALYTICS</h1>
          <p className="text-muted-foreground font-body">Deep dive into your trading performance metrics.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="holographic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-headline text-muted-foreground uppercase">Sharpe Ratio</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{metrics.sharpe}</div>
            </CardContent>
          </Card>
          <Card className="holographic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-headline text-muted-foreground uppercase">Profit Factor</CardTitle>
              <Target className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline text-accent">
                {metrics.profitFactor === null ? '∞' : metrics.profitFactor}
              </div>
            </CardContent>
          </Card>
          <Card className="holographic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-headline text-muted-foreground uppercase">Max Drawdown</CardTitle>
              <ShieldCheck className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline text-destructive">-{metrics.drawdown}%</div>
            </CardContent>
          </Card>
          <Card className="holographic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-headline text-muted-foreground uppercase">Expectancy</CardTitle>
              <BarChart3 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">${metrics.expectancy}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="holographic-card p-6 min-h-[400px]">
          <CardTitle className="font-headline text-lg glow-blue mb-6">PERFORMANCE OVER TIME</CardTitle>
          {chartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis domain={['auto', 'auto']} stroke="#888" fontSize={10} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="balance" stroke="#2a5a9f" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">
              Generate signals to see your performance curve.
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
