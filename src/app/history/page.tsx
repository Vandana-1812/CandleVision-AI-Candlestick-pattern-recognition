"use client"

import React, { useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { AuthGate } from '@/components/auth/AuthGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function HistoryPage() {
  const { user } = useUser();
  const db = useFirestore();

  const signalsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'signals'), orderBy('timestamp', 'desc'), limit(50));
  }, [db, user]);

  const { data: signals, loading } = useCollection(signalsQuery);

  return (
    <AuthGate>
      <div className="flex h-screen bg-background overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold glow-blue">TRADE HISTORY</h1>
          <p className="text-muted-foreground font-body">Historical log of all terminal operations.</p>
        </header>

        <Card className="holographic-card overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="font-headline text-sm uppercase flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Operation Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !signals || signals.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm font-body italic">
                No operations logged yet. Generate signals to populate this log.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/10">
                    <TableHead className="font-headline text-xs uppercase text-muted-foreground">Asset</TableHead>
                    <TableHead className="font-headline text-xs uppercase text-muted-foreground">Type</TableHead>
                    <TableHead className="font-headline text-xs uppercase text-muted-foreground">Execution Price</TableHead>
                    <TableHead className="font-headline text-xs uppercase text-muted-foreground">Profit/Loss</TableHead>
                    <TableHead className="font-headline text-xs uppercase text-muted-foreground text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signals.map((trade: any) => {
                    const isPending = !trade.isVerified;
                    const isProfit = trade.predictionResult === 'correct';
                    const pnl = trade.profitLoss;
                    const status = isPending ? 'Pending' : isProfit ? 'Profit' : 'Loss';
                    return (
                      <TableRow key={trade.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-bold">{trade.symbol}</TableCell>
                        <TableCell>
                          <span className={trade.signal === 'Buy' ? 'text-accent' : trade.signal === 'Sell' ? 'text-destructive' : 'text-muted-foreground'}>
                            {trade.signal}
                          </span>
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {trade.entryPrice != null ? `$${Number(trade.entryPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </TableCell>
                        <TableCell>
                          {isPending ? (
                            <span className="text-muted-foreground text-xs font-headline">Pending</span>
                          ) : (
                            <div className="flex items-center gap-1 font-headline">
                              {isProfit ? (
                                <>
                                  <ArrowUpRight className="w-4 h-4 text-accent" />
                                  <span className="text-accent">+${Math.abs(pnl).toFixed(2)}</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight className="w-4 h-4 text-destructive" />
                                  <span className="text-destructive">-${Math.abs(pnl).toFixed(2)}</span>
                                </>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-headline uppercase ${
                            isPending
                              ? 'bg-muted/20 text-muted-foreground'
                              : isProfit
                              ? 'bg-accent/10 text-accent'
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </main>
      </div>
    </AuthGate>
  );
}
