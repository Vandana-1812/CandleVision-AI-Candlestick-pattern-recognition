
"use client"

import React, { useMemo, useEffect, useRef } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Target, TrendingUp, ShieldCheck, Activity, BrainCircuit } from 'lucide-react';

function getSignalTimestampMs(raw: unknown): number | null {
  if (!raw) return null;
  const maybeTimestamp = raw as { toDate?: () => Date; seconds?: number };
  if (typeof maybeTimestamp.toDate === 'function') {
    const date = maybeTimestamp.toDate();
    return date instanceof Date ? date.getTime() : null;
  }
  if (typeof maybeTimestamp.seconds === 'number') {
    return maybeTimestamp.seconds * 1000;
  }
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (raw instanceof Date) {
    return raw.getTime();
  }
  return null;
}

type PendingSignalPayload = {
  id: string;
  symbol: string;
  signal: string;
  entryPrice: number;
  entryTimeMs: number;
};

type VerificationResult = {
  signalId: string;
  isVerified: boolean;
  predictionResult: 'correct' | 'incorrect';
  profitLoss: number;
  exitPrice: number;
  evaluationWindowHours: number;
  exitLogic: string;
  verificationBasis: string;
  resultSource: string;
};

export default function PerformancePage() {
  const { user } = useUser();
  const db = useFirestore();
  const inFlightVerification = useRef<Set<string>>(new Set());

  const signalsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'signals'), orderBy('timestamp', 'desc'), limit(50));
  }, [db, user]);

  const { data: signals, loading } = useCollection(signalsQuery);

  // Verification computation is performed by the backend API route for consistency.
  useEffect(() => {
    if (!signals || !db || !user) return;

    const verifyPendingSignals = async () => {
      const pendingSignals: PendingSignalPayload[] = signals
        .filter((signal: any) => signal.predictionResult === 'pending' && signal.entryPrice != null && signal.symbol)
        .map((signal: any) => ({
          id: String(signal.id),
          symbol: String(signal.symbol),
          signal: String(signal.signal || ''),
          entryPrice: Number(signal.entryPrice),
          entryTimeMs: getSignalTimestampMs(signal.timestamp) ?? 0,
        }))
        .filter((signal) => signal.id && signal.symbol && Number.isFinite(signal.entryPrice) && signal.entryPrice > 0 && signal.entryTimeMs > 0)
        .filter((signal) => !inFlightVerification.current.has(signal.id));

      if (pendingSignals.length === 0) return;

      pendingSignals.forEach((signal) => inFlightVerification.current.add(signal.id));

      try {
        const response = await fetch('/api/performance/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signals: pendingSignals }),
        });

        if (!response.ok) return;

        const payload = (await response.json()) as { results?: VerificationResult[] };
        const results = Array.isArray(payload.results) ? payload.results : [];

        await Promise.all(
          results.map(async (result) => {
            const signalRef = doc(db, 'users', user.uid, 'signals', result.signalId);
            await updateDoc(signalRef, {
              isVerified: result.isVerified,
              predictionResult: result.predictionResult,
              profitLoss: result.profitLoss,
              exitPrice: result.exitPrice,
              evaluationWindowHours: result.evaluationWindowHours,
              exitLogic: result.exitLogic,
              verificationBasis: result.verificationBasis,
              resultSource: result.resultSource,
              verifiedAt: serverTimestamp(),
            });
          })
        );
      } finally {
        pendingSignals.forEach((signal) => inFlightVerification.current.delete(signal.id));
      }
    };

    void verifyPendingSignals();
  }, [signals, db, user]);

  const stats = useMemo(() => {
    if (!signals || signals.length === 0) return { winRate: 0, totalProfit: 0, accuracy: 0, drawdown: 0 };
    
    const verified = signals.filter((s: any) => s.isVerified);
    if (verified.length === 0) return { winRate: 0, totalProfit: 0, accuracy: 0, drawdown: 0 };

    const wins = verified.filter((s: any) => s.predictionResult === 'correct').length;
    const profit = verified.reduce((acc: number, s: any) => acc + (s.profitLoss || 0), 0);

    // Calculate real max drawdown from equity curve
    let balance = 10000;
    let peak = balance;
    let maxDrawdown = 0;
    for (const s of [...verified].reverse()) {
      balance += s.profitLoss || 0;
      if (balance > peak) peak = balance;
      const drawdownPct = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
      if (drawdownPct > maxDrawdown) maxDrawdown = drawdownPct;
    }

    return {
      winRate: Math.round((wins / verified.length) * 100),
      totalProfit: profit.toFixed(2),
      accuracy: Math.round((wins / verified.length) * 100),
      drawdown: parseFloat(maxDrawdown.toFixed(2)),
    };
  }, [signals]);

  const chartData = useMemo(() => {
    if (!signals) return [];
    let balance = 10000;
    return [...signals].reverse().map((s: any, i: number) => {
      balance += (s.profitLoss || 0);
      return {
        name: i + 1,
        balance,
        pnl: s.profitLoss || 0
      };
    });
  }, [signals]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold glow-blue">AI PERFORMANCE ANALYTICS</h1>
          <p className="text-muted-foreground font-body">Deep verification of neural network prediction accuracy.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="holographic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-headline text-muted-foreground uppercase">Signal Accuracy</CardTitle>
              <Target className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline glow-blue">{stats.accuracy}%</div>
            </CardContent>
          </Card>
          <Card className="holographic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-headline text-muted-foreground uppercase">Net Profit</CardTitle>
              <TrendingUp className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline text-accent">${stats.totalProfit}</div>
            </CardContent>
          </Card>
          <Card className="holographic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-headline text-muted-foreground uppercase">Win Rate</CardTitle>
              <Activity className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{stats.winRate}%</div>
            </CardContent>
          </Card>
          <Card className="holographic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-headline text-muted-foreground uppercase">Max Drawdown</CardTitle>
              <ShieldCheck className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline text-destructive">-{stats.drawdown}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="holographic-card p-6 min-h-[400px]">
            <CardTitle className="font-headline text-sm uppercase mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Equity Curve
            </CardTitle>
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
          </Card>

          <Card className="holographic-card p-6 min-h-[400px]">
            <CardTitle className="font-headline text-sm uppercase mb-6 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-accent" />
              Confidence vs. Accuracy
            </CardTitle>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { range: '90-100%', accuracy: 85 },
                  { range: '75-90%', accuracy: 68 },
                  { range: '60-75%', accuracy: 52 },
                  { range: '< 60%', accuracy: 34 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="range" stroke="#888" fontSize={10} />
                  <YAxis stroke="#888" fontSize={10} />
                  <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                  <Bar dataKey="accuracy" fill="#39ff14" radius={[4, 4, 0, 0]}>
                    { [0,1,2,3].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#39ff14' : '#2a5a9f'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
