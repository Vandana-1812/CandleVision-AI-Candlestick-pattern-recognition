
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarketChart3D } from '@/components/trading/MarketChart3D';
import { fetchRealOHLC, OHLC } from '@/lib/market-data';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, FastForward, Rewind } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MarketReplayPage() {
  const [fullData, setFullData] = useState<OHLC[]>([]);
  const [displayData, setDisplayData] = useState<OHLC[]>([]);
  const [currentIndex, setCurrentIndex] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  useEffect(() => {
    fetchRealOHLC('BTC', '1h', 100).then(setFullData);
  }, []);

  useEffect(() => {
    setDisplayData(fullData.slice(0, currentIndex));
  }, [currentIndex, fullData]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && currentIndex < fullData.length) {
      interval = setInterval(() => {
        setCurrentIndex(prev => prev + 1);
      }, speed);
    } else {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, fullData.length, speed]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold glow-blue">MARKET REPLAY TERMINAL</h1>
          <p className="text-muted-foreground font-body">Simulate historical market conditions to study neural patterns.</p>
        </header>

        <Card className="holographic-card border-primary/20 min-h-[500px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
            <div>
              <CardTitle className="font-headline text-sm uppercase">Replay Engine: BTC/USDT</CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase mt-1">Status: {isPlaying ? 'Streaming' : 'Paused'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentIndex(20)}><RotateCcw className="w-4 h-4"/></Button>
              <Button variant="outline" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 relative p-0 overflow-hidden">
            <MarketChart3D data={displayData} />
            <div className="absolute bottom-10 left-10 right-10 bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-headline text-muted-foreground mb-2">
                <span>START: {fullData[0]?.timestamp.split('T')[0]}</span>
                <span>STEP {currentIndex} / {fullData.length}</span>
                <span>END: {fullData[fullData.length - 1]?.timestamp.split('T')[0]}</span>
              </div>
              <Slider 
                value={[currentIndex]} 
                max={fullData.length} 
                min={20} 
                step={1} 
                onValueChange={(val) => setCurrentIndex(val[0])}
                className="cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
