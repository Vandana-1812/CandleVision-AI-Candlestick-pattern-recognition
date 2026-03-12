"use client"

import React from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Target, ShieldCheck } from 'lucide-react';

export default function AnalyticsPage() {
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
              <div className="text-2xl font-bold font-headline">2.41</div>
            </CardContent>
          </Card>
          <Card className="holographic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-headline text-muted-foreground uppercase">Profit Factor</CardTitle>
              <Target className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline text-accent">1.85</div>
            </CardContent>
          </Card>
          <Card className="holographic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-headline text-muted-foreground uppercase">Max Drawdown</CardTitle>
              <ShieldCheck className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline text-destructive">-4.2%</div>
            </CardContent>
          </Card>
          <Card className="holographic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-headline text-muted-foreground uppercase">Expectancy</CardTitle>
              <BarChart3 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">$142.50</div>
            </CardContent>
          </Card>
        </div>

        <Card className="holographic-card h-96">
          <CardHeader>
            <CardTitle className="font-headline text-lg glow-blue">PERFORMANCE OVER TIME</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-full text-muted-foreground italic">
            Visual analytics engine loading...
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
