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
import { fetchMarketOHLC, MarketDataFetchMeta, OHLC } from '@/lib/market-data';
import { LineChart, Search, Bell, User, Maximize2, Loader2, AlertCircle, Globe, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const [data, setData] = useState<OHLC[]>([]);
  const [symbol, setSymbol] = useState('BTC');
  const [searchInput, setSearchInput] = useState('BTC');
  const [marketLoading, setMarketLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketMeta, setMarketMeta] = useState<MarketDataFetchMeta | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const userRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userRef);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setMarketLoading(true);
      setError(null);
      try {
        const result = await fetchMarketOHLC(symbol, '1h', 60);
        setData(result.candles);
        setMarketMeta(result.meta);
      } catch (e) {
        setError("Synchronization failure with market data stream.");
      } finally {
        setMarketLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [symbol, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.toUpperCase());
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
  const isSimulated = Boolean(marketMeta?.isSimulated || (data.length > 0 && data[0].isSimulated));
  const providerLabel = marketMeta?.providerId ? marketMeta.providerId.toUpperCase() : 'UNKNOWN';
  const fallbackCount = Math.max(0, (marketMeta?.fallbackChain.length ?? 1) - 1);
  const virtualBalance = profile?.virtualBalance ?? 10000;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <form onSubmit={handleSearch} className="flex items-center gap-4 bg-card/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-96 group focus-within:border-primary/50 transition-all">
            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
            <input 
              type="text" 
              placeholder="Search Stocks or Crypto (e.g. AAPL, BTC, TSLA)..." 
              className="bg-transparent border-none outline-none text-sm w-full font-body placeholder:text-muted-foreground/50"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              suppressHydrationWarning
            />
          </form>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-primary/10 pl-4 pr-2 py-1.5 rounded-full border border-primary/20 shadow-[0_0_10px_rgba(42,90,159,0.2)]">
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
                    Terminal Feed: {symbol}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-body">
                    {isSimulated ? 'AI-Estimated Market Projection' : 'Live Real-Time Exchange Stream'}
                    {marketMeta ? ` • Provider: ${providerLabel}` : ''}
                    {fallbackCount > 0 ? ` • Fallback hops: ${fallbackCount}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                   {isSimulated ? (
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-headline text-accent uppercase">
                       <Cpu className="w-3 h-3" />
                       Holographic Sim
                     </div>
                   ) : (
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-headline text-primary uppercase">
                       <Globe className="w-3 h-3" />
                       Live Feed
                     </div>
                   )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 relative p-0 min-h-[400px]">
                 {marketLoading ? (
                   <div className="w-full h-full flex items-center justify-center">
                     <Loader2 className="w-8 h-8 text-primary animate-spin" />
                   </div>
                 ) : (
                   <MarketChart3D data={data} />
                 )}
                 {!marketLoading && data.length > 0 && (
                   <div className="absolute top-4 left-4 p-3 bg-background/80 backdrop-blur-md rounded-lg border border-primary/20 space-y-1 z-10 shadow-xl">
                      <p className="text-[10px] font-headline text-muted-foreground uppercase">Current Price</p>
                      <p className="text-xl font-headline font-bold text-accent glow-green" suppressHydrationWarning>
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] font-headline text-accent">
                        <span className={`w-2 h-2 rounded-full ${isSimulated ? 'bg-primary animate-pulse' : 'bg-accent animate-pulse'}`} />
                        {isSimulated ? 'SIMULATED TRACKING' : 'LIVE DATA STREAM'}
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
      </main>
    </div>
  );
}
