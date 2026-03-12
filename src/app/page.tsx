"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { TradingStats } from '@/components/dashboard/TradingStats';
import { MarketChart3D } from '@/components/trading/MarketChart3D';
import { AISignalPanel } from '@/components/trading/AISignalPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateMockOHLC, OHLC } from '@/lib/market-data';
import { LineChart, Search, Bell, User, Maximize2 } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<OHLC[]>([]);
  const [symbol, setSymbol] = useState('BTC/USDT');

  useEffect(() => {
    setData(generateMockOHLC(60, symbol));
    // Simulated live updates
    const interval = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const newData = generateMockOHLC(1, symbol)[0];
        return [...prev.slice(1), newData];
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header Section */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4 bg-card/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-96">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search assets, strategies, users..." 
              className="bg-transparent border-none outline-none text-sm w-full font-body"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-3 bg-primary/10 pl-4 pr-2 py-1.5 rounded-full border border-primary/20">
              <span className="text-sm font-headline text-white">$10,450.20</span>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Portfolio Stats */}
        <TradingStats 
          balance={10450.20} 
          pnl={450.20} 
          winRate={68} 
          trades={14} 
        />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-250px)]">
          {/* Main Chart Area */}
          <div className="col-span-12 lg:col-span-8 space-y-6 h-full">
            <Card className="holographic-card border-primary/20 h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-xl glow-blue uppercase tracking-tight flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-primary" />
                    Holographic Market Feed
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-body">Real-time OHLC 3D Visualization</p>
                </div>
                <div className="flex items-center gap-2">
                  <Tabs defaultValue="1h" className="w-[200px]">
                    <TabsList className="bg-background/50">
                      <TabsTrigger value="15m" className="text-xs uppercase font-headline">15m</TabsTrigger>
                      <TabsTrigger value="1h" className="text-xs uppercase font-headline">1h</TabsTrigger>
                      <TabsTrigger value="4h" className="text-xs uppercase font-headline">4h</TabsTrigger>
                      <TabsTrigger value="1d" className="text-xs uppercase font-headline">1d</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <button className="p-2 hover:bg-white/5 rounded-md transition-colors">
                    <Maximize2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 relative p-0 min-h-[400px]">
                 <MarketChart3D data={data} />
                 {/* 3D Overlay indicators would go here */}
                 <div className="absolute top-4 left-4 p-3 bg-background/80 backdrop-blur-md rounded-lg border border-primary/20 space-y-1">
                    <p className="text-[10px] font-headline text-muted-foreground uppercase">Current Price</p>
                    <p className="text-xl font-headline font-bold text-accent glow-green">
                      ${data.length > 0 ? data[data.length-1].close.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-headline text-accent">
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      LIVE FEED ACTIVE
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Signal Sidebar */}
          <div className="col-span-12 lg:col-span-4 h-full">
            <AISignalPanel marketData={data} symbol={symbol} />
          </div>
        </div>

        {/* Lower Dashboard Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="holographic-card col-span-1">
              <CardHeader>
                <CardTitle className="font-headline text-sm uppercase glow-blue">Education Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs font-headline">
                   <span className="text-muted-foreground">Candlestick Mastery</span>
                   <span className="text-primary">85%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[85%]" />
                </div>
                <button className="w-full py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-headline transition-colors">
                  CONTINUE LEARNING
                </button>
              </CardContent>
           </Card>

           <Card className="holographic-card col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="font-headline text-sm uppercase glow-blue">Recent Market Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1 p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-[10px] font-headline text-accent uppercase mb-1">Bullish Intensity</p>
                    <p className="text-lg font-bold">Strong</p>
                  </div>
                   <div className="flex-1 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-[10px] font-headline text-primary uppercase mb-1">Global Sentiment</p>
                    <p className="text-lg font-bold">Optimistic</p>
                  </div>
                   <div className="flex-1 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-[10px] font-headline text-destructive uppercase mb-1">Risk Factor</p>
                    <p className="text-lg font-bold">Low</p>
                  </div>
                </div>
              </CardContent>
           </Card>
        </div>
      </main>
    </div>
  );
}