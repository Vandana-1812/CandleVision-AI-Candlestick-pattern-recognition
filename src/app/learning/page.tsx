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
          <h1 className="text-3xl font-headline font-bold glow-blue">
            MARKET REPLAY TERMINAL
          </h1>
          <p className="text-muted-foreground font-body">
            Simulate historical market conditions to study patterns.
          </p>
        </header>

        <Card className="holographic-card border-primary/20 flex flex-col">

          {/* HEADER */}
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
            <div>
              <CardTitle className="font-headline text-sm uppercase">
                Replay Engine: BTC/USDT
              </CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase mt-1">
                Status: {isPlaying ? 'Streaming' : 'Paused'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">

              <Button variant="outline" size="icon" onClick={() => setCurrentIndex(20)}>
                <RotateCcw className="w-4 h-4"/>
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentIndex(prev => Math.max(20, prev - 1))}
              >
                <Rewind className="w-4 h-4"/>
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentIndex(prev => Math.min(fullData.length, prev + 1))}
              >
                <FastForward className="w-4 h-4"/>
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
              </Button>

              <div className="flex items-center gap-1 ml-2">
                <Button variant="outline" size="sm" onClick={() => setSpeed(1000)}>1x</Button>
                <Button variant="outline" size="sm" onClick={() => setSpeed(500)}>2x</Button>
                <Button variant="outline" size="sm" onClick={() => setSpeed(200)}>5x</Button>
              </div>

            </div>
          </CardHeader>

          {/* CONTENT */}
          <CardContent className="p-4 space-y-4">

            {/* CHART */}
            <div className="w-full h-[400px] bg-black/40 rounded-xl overflow-hidden">
              <MarketChart3D data={displayData} />
            </div>

            {/* SLIDER BELOW CHART (FIXED) */}
            <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-headline text-muted-foreground">
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
              />
            </div>

            {/* LOWER SECTION */}
            <div className="flex gap-4">

              {/* CURRENT DATA */}
              <div className="flex-1 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-xs space-y-1">
                <p className="text-muted-foreground">CURRENT DATA</p>
                <p>Price: {displayData.at(-1)?.close?.toFixed(2)}</p>
                <p>High: {displayData.at(-1)?.high?.toFixed(2)}</p>
                <p>Low: {displayData.at(-1)?.low?.toFixed(2)}</p>
                <p>Volume: {displayData.at(-1)?.volume?.toFixed(2)}</p>
              </div>

              {/* MARKET INSIGHT */}
              <div className="flex-1 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-xs space-y-1">
                <p className="text-muted-foreground">MARKET INSIGHT</p>

                {displayData.length > 1 && (
                  <>
                    <p>
                      Trend: {displayData.at(-1)!.close > displayData.at(-2)!.close
                        ? "Uptrend 📈"
                        : "Downtrend 📉"}
                    </p>

                    <p>
                      Momentum: {Math.abs(displayData.at(-1)!.close - displayData.at(-2)!.close) > 50
                        ? "Strong"
                        : "Weak"}
                    </p>

                    <p>
                      Observation: {displayData.at(-1)!.close > displayData.at(-2)!.close
                        ? "Price is increasing"
                        : "Price is decreasing"}
                    </p>
                  </>
                )}
              </div>

            </div>

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
