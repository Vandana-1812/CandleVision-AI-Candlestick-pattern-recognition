
"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReplayCandlestickChart } from '@/components/trading/ReplayCandlestickChart';
import { fetchRealOHLC, OHLC } from '@/lib/market-data';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowDownRight,
  ArrowUpRight,
  FastForward,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  Wallet,
} from 'lucide-react';

const DEFAULT_BALANCE = 10000;
const MIN_REPLAY_WINDOW = 20;
const DEFAULT_TRADE_SIZE = 1000;
const SPEED_OPTIONS = [
  { label: '0.5x', value: 2000 },
  { label: '1x', value: 1000 },
  { label: '2x', value: 500 },
  { label: '4x', value: 250 },
];

interface ReplayPosition {
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  investedAmount: number;
  openedAt: string;
}

interface ReplayTrade {
  id: number;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  investedAmount: number;
  pnl: number;
  openedAt: string;
  closedAt: string;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const MEANINGFUL_PNL_EPSILON = 0.01;

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MarketReplayPage() {
  const [fullData, setFullData] = useState<OHLC[]>([]);
  const [currentIndex, setCurrentIndex] = useState(MIN_REPLAY_WINDOW);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [isLoading, setIsLoading] = useState(true);
  const [tradeSize, setTradeSize] = useState(DEFAULT_TRADE_SIZE);
  const [balance, setBalance] = useState(DEFAULT_BALANCE);
  const [position, setPosition] = useState<ReplayPosition | null>(null);
  const [completedTrades, setCompletedTrades] = useState<ReplayTrade[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadReplayData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchRealOHLC('BTC', '1h', 160);

        if (!isMounted) return;

        setFullData(data);
        setCurrentIndex(Math.min(Math.max(MIN_REPLAY_WINDOW, 1), data.length));
      } catch (loadError) {
        if (!isMounted) return;
        setError('Unable to initialize replay feed.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReplayData();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayData = useMemo(
    () => fullData.slice(0, currentIndex),
    [currentIndex, fullData]
  );

  const currentBar = displayData[displayData.length - 1];
  const currentPrice = currentBar?.close ?? 0;
  const replayProgress = fullData.length > 0 ? (currentIndex / fullData.length) * 100 : 0;
  const meaningfulTrades = completedTrades.filter((trade) => Math.abs(trade.pnl) >= MEANINGFUL_PNL_EPSILON);
  const unrealizedPnl = position
    ? position.side === 'long'
      ? (currentPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - currentPrice) * position.quantity
    : 0;
  const equity = balance + (position ? position.investedAmount + unrealizedPnl : 0);
  const realizedPnl = meaningfulTrades.reduce((total, trade) => total + trade.pnl, 0);
  const winRate = meaningfulTrades.length
    ? (meaningfulTrades.filter((trade) => trade.pnl > 0).length / meaningfulTrades.length) * 100
    : 0;
  const averagePnl = meaningfulTrades.length ? realizedPnl / meaningfulTrades.length : 0;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isPlaying && currentIndex < fullData.length) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, fullData.length));
      }, speed);
    } else {
      setIsPlaying(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentIndex, fullData.length, speed]);

  const openPosition = (side: ReplayPosition['side']) => {
    if (!currentBar || position) return;

    const normalizedTradeSize = Math.max(100, Math.floor(tradeSize || 0));
    const capitalToDeploy = Math.min(normalizedTradeSize, balance);

    if (capitalToDeploy <= 0) return;

    const quantity = capitalToDeploy / currentBar.close;

    setBalance((prev) => prev - capitalToDeploy);
    setPosition({
      side,
      entryPrice: currentBar.close,
      quantity,
      investedAmount: capitalToDeploy,
      openedAt: currentBar.timestamp,
    });
  };

  const closePosition = () => {
    if (!position || !currentBar) return;

    const pnl =
      position.side === 'long'
        ? (currentBar.close - position.entryPrice) * position.quantity
        : (position.entryPrice - currentBar.close) * position.quantity;

    const settledCapital = position.investedAmount + pnl;

    setBalance((prev) => prev + settledCapital);
    setCompletedTrades((prev) => [
      {
        id: prev.length + 1,
        side: position.side,
        entryPrice: position.entryPrice,
        exitPrice: currentBar.close,
        quantity: position.quantity,
        investedAmount: position.investedAmount,
        pnl,
        openedAt: position.openedAt,
        closedAt: currentBar.timestamp,
      },
      ...prev,
    ]);
    setPosition(null);
  };

  const resetSession = () => {
    setIsPlaying(false);
    setCurrentIndex(Math.min(Math.max(MIN_REPLAY_WINDOW, 1), fullData.length || MIN_REPLAY_WINDOW));
    setBalance(DEFAULT_BALANCE);
    setTradeSize(DEFAULT_TRADE_SIZE);
    setPosition(null);
    setCompletedTrades([]);
  };

  const stepReplay = (direction: -1 | 1) => {
    setIsPlaying(false);
    setCurrentIndex((prev) => {
      const nextIndex = prev + direction;
      return Math.max(MIN_REPLAY_WINDOW, Math.min(nextIndex, fullData.length));
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold glow-blue">MARKET REPLAY TERMINAL</h1>
          <p className="text-muted-foreground font-body">Simulate historical market conditions to study neural patterns.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px] gap-6 items-start">
          <Card className="holographic-card border-primary/20 min-h-[580px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 gap-4">
              <div>
                <CardTitle className="font-headline text-sm uppercase">Replay Engine: BTC/USDT</CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase mt-1">
                  Status: {isPlaying ? 'Streaming' : 'Paused'} • Step {currentIndex} / {fullData.length || '--'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {replayProgress.toFixed(0)}% complete
                </Badge>
                <Button variant="outline" size="icon" onClick={() => stepReplay(-1)} disabled={currentIndex <= MIN_REPLAY_WINDOW}>
                  <Rewind className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setIsPlaying((prev) => !prev)} disabled={!fullData.length}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => stepReplay(1)} disabled={currentIndex >= fullData.length}>
                  <FastForward className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={resetSession}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 flex flex-col gap-5 overflow-hidden">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground font-headline text-xs tracking-[0.3em]">
                  LOADING REPLAY FEED
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center text-destructive font-headline text-xs tracking-[0.2em]">
                  {error}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-white/10 bg-background/80 backdrop-blur-md px-4 py-3">
                      <p className="text-[10px] uppercase font-headline text-muted-foreground">Current Price</p>
                      <p className="text-lg xl:text-xl font-headline text-accent tabular-nums leading-tight">{formatCurrency(currentPrice)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-background/80 backdrop-blur-md px-4 py-3">
                      <p className="text-[10px] uppercase font-headline text-muted-foreground">Replay Time</p>
                      <p className="text-sm font-headline leading-tight">{formatTimestamp(currentBar?.timestamp)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-background/80 backdrop-blur-md px-4 py-3">
                      <p className="text-[10px] uppercase font-headline text-muted-foreground">Open Position</p>
                      <p className="text-sm font-headline leading-tight">
                        {position ? `${position.side.toUpperCase()} • ${numberFormatter.format(position.quantity)} BTC` : 'No active trade'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-background/80 backdrop-blur-md px-4 py-3">
                      <p className="text-[10px] uppercase font-headline text-muted-foreground">Unrealized PnL</p>
                      <p className={`text-sm font-headline tabular-nums leading-tight ${unrealizedPnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {formatCurrency(unrealizedPnl)}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 min-h-[460px] rounded-2xl border border-white/10 bg-background/30 overflow-hidden">
                    <ReplayCandlestickChart data={displayData} />
                  </div>

                  <div className="bg-black/65 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="text-[10px] font-headline text-muted-foreground uppercase">
                        Start: {fullData[0]?.timestamp.split('T')[0] ?? '--'}
                      </div>
                      <div className="text-[10px] font-headline text-primary uppercase">
                        Candle {currentIndex} of {fullData.length}
                      </div>
                      <div className="text-[10px] font-headline text-muted-foreground uppercase">
                        End: {fullData[fullData.length - 1]?.timestamp.split('T')[0] ?? '--'}
                      </div>
                    </div>
                    <Slider
                      value={[currentIndex]}
                      max={fullData.length || MIN_REPLAY_WINDOW}
                      min={Math.min(MIN_REPLAY_WINDOW, fullData.length || MIN_REPLAY_WINDOW)}
                      step={1}
                      onValueChange={(value) => {
                        setIsPlaying(false);
                        setCurrentIndex(value[0]);
                      }}
                      className="cursor-pointer"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      {SPEED_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={speed === option.value ? 'default' : 'outline'}
                          size="sm"
                          className="font-headline text-[10px] uppercase"
                          onClick={() => setSpeed(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6 xl:min-w-[360px] 2xl:min-w-[390px]">
            <Card className="holographic-card border-primary/20">
              <CardHeader>
                <CardTitle className="font-headline text-sm uppercase flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  Replay Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Cash</p>
                    <p className="text-base xl:text-xl font-headline tabular-nums leading-tight break-words">
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Equity</p>
                    <p className="text-base xl:text-xl font-headline text-primary tabular-nums leading-tight break-words">
                      {formatCurrency(equity)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Realized</p>
                    <p className={`text-base xl:text-xl font-headline tabular-nums leading-tight break-words ${realizedPnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {formatCurrency(realizedPnl)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Win Rate</p>
                    <p className="text-base xl:text-xl font-headline tabular-nums leading-tight">{winRate.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-headline text-muted-foreground">Trade Size (USD)</label>
                  <Input
                    type="number"
                    min={100}
                    step={100}
                    value={tradeSize}
                    onChange={(event) => setTradeSize(Number(event.target.value) || 0)}
                    className="bg-background/40 border-white/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="bg-accent hover:bg-accent/80 text-black font-headline text-sm"
                    onClick={() => openPosition('long')}
                    disabled={!currentBar || !!position || balance < 100}
                  >
                    Buy / Long
                  </Button>
                  <Button
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 font-headline text-sm"
                    onClick={() => openPosition('short')}
                    disabled={!currentBar || !!position || balance < 100}
                  >
                    Sell / Short
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full font-headline"
                  onClick={closePosition}
                  disabled={!position}
                >
                  Close Position
                </Button>

                <div className="rounded-xl border border-white/10 bg-background/30 p-4 space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-headline text-muted-foreground">
                    <span>Active Position</span>
                    <span>{position ? position.side.toUpperCase() : 'NONE'}</span>
                  </div>
                  {position ? (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span>Entry</span>
                        <span className="font-headline">{formatCurrency(position.entryPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Size</span>
                        <span className="font-headline">{numberFormatter.format(position.quantity)} BTC</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Opened</span>
                        <span className="font-headline">{formatTimestamp(position.openedAt)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Open a long or short trade to start tracking replay performance.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="holographic-card border-primary/20">
              <CardHeader>
                <CardTitle className="font-headline text-sm uppercase">Recent Replay Trades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Closed Trades</p>
                    <p className="text-base xl:text-xl font-headline tabular-nums">{meaningfulTrades.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                    <p className="text-[10px] uppercase font-headline text-muted-foreground">Avg PnL</p>
                    <p className={`text-base xl:text-xl font-headline tabular-nums leading-tight break-words ${averagePnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {formatCurrency(averagePnl)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {meaningfulTrades.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-muted-foreground">
                      Meaningful replay trades will appear here once positions close with a real price move.
                    </div>
                  ) : (
                    meaningfulTrades.map((trade) => (
                      <div key={trade.id} className="rounded-xl border border-white/10 bg-background/30 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {trade.side === 'long' ? (
                              <ArrowUpRight className="w-4 h-4 text-accent" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-destructive" />
                            )}
                            <span className="font-headline uppercase text-sm">{trade.side}</span>
                          </div>
                          <Badge
                            className={
                              trade.pnl >= 0
                                ? 'bg-accent/10 text-accent border-accent/20'
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                            }
                          >
                            {formatCurrency(trade.pnl)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>Entry: <span className="text-foreground">{formatCurrency(trade.entryPrice)}</span></div>
                          <div>Exit: <span className="text-foreground">{formatCurrency(trade.exitPrice)}</span></div>
                          <div>Opened: <span className="text-foreground">{formatTimestamp(trade.openedAt)}</span></div>
                          <div>Closed: <span className="text-foreground">{formatTimestamp(trade.closedAt)}</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
