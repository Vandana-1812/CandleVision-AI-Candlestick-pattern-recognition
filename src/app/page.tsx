
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { TradingStats } from '@/components/dashboard/TradingStats';
import { MarketChart3D } from '@/components/trading/MarketChart3D';
import { AISignalPanel } from '@/components/trading/AISignalPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchRealOHLC, OHLC } from '@/lib/market-data';
import { LineChart, Search, Bell, User, Maximize2, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const [data, setData] = useState<OHLC[]>([]);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [searchInput, setSearchInput] = useState('BTCUSDT');
  const [marketLoading, setMarketLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch user profile for real balance
  const userRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userRef);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // Fetch real-time market data
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setMarketLoading(true);
      setError(null);
      try {
        const result = await fetchRealOHLC(symbol);
        if (result && result.length > 0) {
          setData(result);
        } else {
          setError(`Symbol "${symbol}" not found on the operative exchange.`);
          toast({
            variant: "destructive",
            title: "Asset Unavailable",
            description: `The symbol "${symbol}" is not currently supported by the active data stream.`
          });
        }
      } catch (e) {
        setError("Synchronization failure with market data stream.");
      } finally {
        setMarketLoading(false);
      }
    };

    loadData();

    // Poll for updates every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [symbol, user, toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.toUpperCase().replace('/', ''));
    }
  };

  if (userLoading || (user && profileLoading)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const virtualBalance = profile?.virtualBalance ?? 10000;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <form onSubmit={handleSearch} className="flex items-center gap-4 bg-card/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-96">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search (e.g. BTCUSDT, ETH, SOL)..." 
              className="bg-transparent border-none outline-none text-sm w-full font-body"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              suppressHydrationWarning
            />
          </form>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors relative" suppressHydrationWarning>
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-3 bg-primary/10 pl-4 pr-2 py-1.5 rounded-full border border-primary/20">
              <span className="text-sm font-headline text-white" suppressHydrationWarning>
                ${virtualBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden border border-primary/30">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
          </div>
        </header>

        <TradingStats 
          balance={virtualBalance} 
          pnl={virtualBalance - 10000} 
          winRate={profile?.winRate ?? 0} 
          trades={profile?.tradesCount ?? 0} 
        />

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-250px)]">
          <div className="col-span-12 lg:col-span-8 space-y-6 h-full">
            <Card className="holographic-card border-primary/20 h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-xl glow-blue uppercase tracking-tight flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-primary" />
                    Live Holographic Feed: {symbol}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-body">Real-time OHLC from Exchange API</p>
                </div>
                <div className="flex items-center gap-2">
                  <Tabs defaultValue="1h" className="w-[200px]">
                    <TabsList className="bg-background/50">
                      <TabsTrigger value="15m" className="text-xs uppercase font-headline">15m</TabsTrigger>
                      <TabsTrigger value="1h" className="text-xs uppercase font-headline">1h</TabsTrigger>
                      <TabsTrigger value="4h" className="text-xs uppercase font-headline">4h</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <button className="p-2 hover:bg-white/5 rounded-md transition-colors" suppressHydrationWarning>
                    <Maximize2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 relative p-0 min-h-[400px]">
                 {marketLoading ? (
                   <div className="w-full h-full flex items-center justify-center">
                     <Loader2 className="w-8 h-8 text-primary animate-spin" />
                   </div>
                 ) : error ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-4 text-destructive opacity-50" />
                      <p className="font-headline text-lg uppercase mb-2">Synchronization Error</p>
                      <p className="max-w-md text-sm">{error}</p>
                      <button 
                        onClick={() => setSymbol('BTCUSDT')}
                        className="mt-6 px-6 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-lg text-xs font-headline transition-all"
                      >
                        RESET TO DEFAULT FEED
                      </button>
                    </div>
                 ) : (
                   <MarketChart3D data={data} />
                 )}
                 {!marketLoading && !error && data.length > 0 && (
                   <div className="absolute top-4 left-4 p-3 bg-background/80 backdrop-blur-md rounded-lg border border-primary/20 space-y-1 z-10">
                      <p className="text-[10px] font-headline text-muted-foreground uppercase">Current Price</p>
                      <p className="text-xl font-headline font-bold text-accent glow-green" suppressHydrationWarning>
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] font-headline text-accent">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        LIVE DATA STREAM
                      </div>
                   </div>
                 )}
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-4 h-full">
            <AISignalPanel marketData={data} symbol={symbol} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
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
                <button className="w-full py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-headline transition-colors" suppressHydrationWarning>
                  CONTINUE LEARNING
                </button>
              </CardContent>
           </Card>

           <Card className="holographic-card col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="font-headline text-sm uppercase glow-blue">Market Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1 p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-[10px] font-headline text-accent uppercase mb-1">Exchange Connection</p>
                    <p className="text-lg font-bold">{error ? 'Limited' : 'Active'}</p>
                  </div>
                   <div className="flex-1 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-[10px] font-headline text-primary uppercase mb-1">Latency</p>
                    <p className="text-lg font-bold">42ms</p>
                  </div>
                   <div className="flex-1 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-[10px] font-headline text-destructive uppercase mb-1">Volatility</p>
                    <p className="text-lg font-bold">Moderate</p>
                  </div>
                </div>
              </CardContent>
           </Card>
        </div>
      </main>
    </div>
  );
}
