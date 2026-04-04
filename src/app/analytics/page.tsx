"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { AuthGate } from '@/components/auth/AuthGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Target, ShieldCheck, BrainCircuit, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { TrainingReport } from '@/lib/training/types';

type Signal = {
  id: string;
  isVerified?: boolean;
  predictionResult?: 'correct' | 'incorrect' | 'pending';
  profitLoss?: number;
  confidenceScore?: number;
  timestamp?: { toDate?: () => Date; seconds?: number } | string | Date;
};

function normalizeTimestamp(raw: Signal['timestamp']) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw.toDate === 'function') return raw.toDate().getTime();
  if (typeof raw.seconds === 'number') return raw.seconds * 1000;
  return null;
}

export default function AnalyticsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [trainingReport, setTrainingReport] = useState<TrainingReport | null>(null);
  const [trainingLoading, setTrainingLoading] = useState(true);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  const signalsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'signals'), orderBy('timestamp', 'desc'), limit(100));
  }, [db, user]);

  const { data: signals, loading } = useCollection(signalsQuery);

  const verifiedSignals = useMemo(() => {
    return (signals as Signal[]).filter(
      (signal) => signal.isVerified && typeof signal.profitLoss === 'number'
    );
  }, [signals]);

  useEffect(() => {
    let cancelled = false;

    const loadTrainingReport = async () => {
      setTrainingLoading(true);
      setTrainingError(null);
      try {
        const response = await fetch('/api/training/nifty?interval=1h&range=1mo&horizonCandles=6&thresholdPct=0.35');
        if (!response.ok) {
          throw new Error(`Training request failed: ${response.status}`);
        }

        const payload = await response.json();
        if (!cancelled) {
          setTrainingReport(payload);
        }
      } catch (error: any) {
        if (!cancelled) {
          setTrainingError(error?.message || 'Unable to load NIFTY training report');
        }
      } finally {
        if (!cancelled) {
          setTrainingLoading(false);
        }
      }
    };

    loadTrainingReport();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    if (verifiedSignals.length === 0) {
      return { sharpe: 0, profitFactor: null as number | null, drawdown: 0, expectancy: 0 };
    }

    const pnls: number[] = verifiedSignals.map((signal) => Number(signal.profitLoss || 0));
    const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
    const variance = pnls.reduce((acc, v) => acc + (v - mean) ** 2, 0) / pnls.length;
    const std = Math.sqrt(variance);
    const sharpe = std > 0 ? parseFloat(((mean / std) * Math.sqrt(8760)).toFixed(2)) : 0;

    const grossProfit = pnls.filter((v) => v > 0).reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(pnls.filter((v) => v < 0).reduce((a, b) => a + b, 0));
    const profitFactor =
      grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? Infinity : 0;

    let balance = 10000;
    let peak = balance;
    let maxDrawdown = 0;
    for (const pnl of [...pnls].reverse()) {
      balance += pnl;
      if (balance > peak) peak = balance;
      const dd = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

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
  }, [verifiedSignals]);

  const equityChartData = useMemo(() => {
    if (verifiedSignals.length === 0) return [];

    let balance = 10000;
    return [...verifiedSignals].reverse().map((signal, index) => {
      balance += Number(signal.profitLoss || 0);
      const timestampMs = normalizeTimestamp(signal.timestamp);
      const label = timestampMs
        ? new Date(timestampMs).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : `#${index + 1}`;

      return {
        name: label,
        balance: Number(balance.toFixed(2)),
      };
    });
  }, [verifiedSignals]);

  const confidenceAccuracyData = useMemo(() => {
    const buckets = [
      { label: '90-100%', min: 90, max: 100 },
      { label: '75-89%', min: 75, max: 89.99 },
      { label: '60-74%', min: 60, max: 74.99 },
      { label: '<60%', min: 0, max: 59.99 },
    ];

    return buckets.map((bucket) => {
      const inBucket = verifiedSignals.filter((signal) => {
        const score = Number(signal.confidenceScore || 0);
        return score >= bucket.min && score <= bucket.max;
      });

      if (inBucket.length === 0) {
        return {
          range: bucket.label,
          accuracy: 0,
          samples: 0,
        };
      }

      const wins = inBucket.filter((signal) => signal.predictionResult === 'correct').length;
      return {
        range: bucket.label,
        accuracy: Math.round((wins / inBucket.length) * 100),
        samples: inBucket.length,
      };
    });
  }, [verifiedSignals]);

  return (
    <AuthGate>
      <div className="flex h-screen bg-background overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold glow-blue">ADVANCED ANALYTICS</h1>
          <p className="text-muted-foreground font-body">Deep dive into your trading performance metrics.</p>
        </header>

        {loading ? (
          <Card className="holographic-card">
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <>
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
                    {metrics.profitFactor === null ? 'N/A' : metrics.profitFactor}
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="holographic-card p-6 min-h-[400px]">
                <CardTitle className="font-headline text-lg glow-blue mb-6">EQUITY CURVE</CardTitle>
                {equityChartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={equityChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={10} />
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
                    No verified signals yet. Generate and verify signals to render equity analytics.
                  </div>
                )}
              </Card>

              <Card className="holographic-card p-6 min-h-[400px]">
                <CardTitle className="font-headline text-lg glow-blue mb-6">CONFIDENCE VS ACCURACY</CardTitle>
                {verifiedSignals.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={confidenceAccuracyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="range" stroke="#888" fontSize={10} />
                        <YAxis stroke="#888" fontSize={10} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                          labelStyle={{ color: '#94a3b8' }}
                          formatter={(value, _name, item) => [`${value}%`, `Accuracy (${item.payload.samples} samples)`]}
                        />
                        <Bar dataKey="accuracy" fill="#2a5a9f" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">
                    Verified signals are required to compute confidence bucket accuracy.
                  </div>
                )}
              </Card>
            </div>

            <Card className="holographic-card p-6 min-h-[400px]">
              <CardTitle className="font-headline text-lg glow-blue mb-6 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                NIFTY TRAINING MODULE
              </CardTitle>
              {trainingLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : trainingError ? (
                <div className="h-[300px] flex items-center justify-center text-center text-sm text-destructive">
                  {trainingError}
                </div>
              ) : trainingReport ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/10 p-4 bg-background/40">
                      <p className="text-[10px] uppercase text-muted-foreground font-headline">Train Accuracy</p>
                      <p className="text-2xl font-headline">{(trainingReport.trainMetrics.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-xl border border-white/10 p-4 bg-background/40">
                      <p className="text-[10px] uppercase text-muted-foreground font-headline">Test Accuracy</p>
                      <p className="text-2xl font-headline text-accent">{(trainingReport.testMetrics.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-xl border border-white/10 p-4 bg-background/40">
                      <p className="text-[10px] uppercase text-muted-foreground font-headline">Macro F1</p>
                      <p className="text-2xl font-headline">{trainingReport.testMetrics.macroF1.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 p-4 bg-background/40">
                      <p className="text-[10px] uppercase text-muted-foreground font-headline">Latest Model Bias</p>
                      <p className="text-2xl font-headline text-primary">{trainingReport.recentInference.predictedLabel}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 p-4 bg-background/30 space-y-2">
                    <p className="text-[10px] uppercase text-muted-foreground font-headline">Dataset</p>
                    <p className="text-sm text-muted-foreground">
                      {trainingReport.dataset.examples} examples from {trainingReport.dataset.candles} NIFTY candles, latest close {trainingReport.dataset.latestClose}.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Buy {Math.round(trainingReport.recentInference.probabilities.Buy * 100)}%, Hold {Math.round(trainingReport.recentInference.probabilities.Hold * 100)}%, Sell {Math.round(trainingReport.recentInference.probabilities.Sell * 100)}%.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {trainingReport.featureImportance.map((group) => (
                      <div key={group.className} className="rounded-xl border border-white/10 p-4 bg-background/30 space-y-3">
                        <p className="text-[10px] uppercase text-muted-foreground font-headline">{group.className} Drivers</p>
                        <div className="space-y-1">
                          {group.strongestPositive.slice(0, 3).map((item) => (
                            <p key={`${group.className}-${item.feature}`} className="text-sm text-muted-foreground">
                              {item.feature}: {item.weight.toFixed(3)}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          </>
        )}
        </main>
      </div>
    </AuthGate>
  );
}
