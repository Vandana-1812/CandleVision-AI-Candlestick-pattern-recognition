"use client"

import React from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const trades = [
  { id: 1, symbol: 'BTCUSDT', type: 'Buy', price: '$42,500', pnl: '+$450.20', status: 'Profit' },
  { id: 2, symbol: 'ETHUSDT', type: 'Sell', price: '$2,300', pnl: '-$120.50', status: 'Loss' },
  { id: 3, symbol: 'SOLUSDT', type: 'Buy', price: '$95.00', pnl: '+$2,100.00', status: 'Profit' },
  { id: 4, symbol: 'BNBUSDT', type: 'Buy', price: '$310.00', pnl: '+$45.00', status: 'Profit' },
];

export default function HistoryPage() {
  return (
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
                {trades.map((trade) => (
                  <TableRow key={trade.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-bold">{trade.symbol}</TableCell>
                    <TableCell>
                      <span className={trade.type === 'Buy' ? 'text-accent' : 'text-destructive'}>
                        {trade.type}
                      </span>
                    </TableCell>
                    <TableCell className="font-body text-sm">{trade.price}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-headline">
                        {trade.status === 'Profit' ? (
                          <>
                            <ArrowUpRight className="w-4 h-4 text-accent" />
                            <span className="text-accent">{trade.pnl}</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="w-4 h-4 text-destructive" />
                            <span className="text-destructive">{trade.pnl}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <span className={`px-2 py-1 rounded-full text-[10px] font-headline uppercase ${
                         trade.status === 'Profit' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
                       }`}>
                         {trade.status}
                       </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
