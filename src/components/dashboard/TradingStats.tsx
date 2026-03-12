"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet, Award, Activity } from 'lucide-react';

interface TradingStatsProps {
  balance: number;
  pnl: number;
  winRate: number;
  trades: number;
}

export const TradingStats: React.FC<TradingStatsProps> = ({ balance, pnl, winRate, trades }) => {
  const isPositive = pnl >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="holographic-card border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium font-headline uppercase tracking-wider text-muted-foreground">Virtual Balance</CardTitle>
          <Wallet className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-headline glow-blue">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Starting Capital: $10,000</p>
        </CardContent>
      </Card>

      <Card className="holographic-card border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium font-headline uppercase tracking-wider text-muted-foreground">Profit / Loss</CardTitle>
          <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-accent' : 'text-destructive'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold font-headline ${isPositive ? 'text-accent glow-green' : 'text-destructive glow-orange'}`}>
            {isPositive ? '+' : ''}{pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total overall growth</p>
        </CardContent>
      </Card>

      <Card className="holographic-card border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium font-headline uppercase tracking-wider text-muted-foreground">Win Rate</CardTitle>
          <Award className="w-4 h-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-headline text-accent glow-green">{winRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">Based on {trades} trades</p>
        </CardContent>
      </Card>

      <Card className="holographic-card border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium font-headline uppercase tracking-wider text-muted-foreground">Active Trades</CardTitle>
          <Activity className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-headline">{trades}</div>
          <p className="text-xs text-muted-foreground mt-1">In the last 30 days</p>
        </CardContent>
      </Card>
    </div>
  );
};