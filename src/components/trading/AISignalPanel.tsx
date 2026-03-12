"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, BrainCircuit, Info, ChevronRight } from 'lucide-react';
import { generateTradingSignals, GenerateTradingSignalOutput } from '@/ai/flows/generate-trading-signals';
import { explainTradingSignals, ExplainTradingSignalOutput } from '@/ai/flows/explain-trading-signals';
import { OHLC } from '@/lib/market-data';

interface AISignalPanelProps {
  marketData: OHLC[];
  symbol: string;
}

export const AISignalPanel: React.FC<AISignalPanelProps> = ({ marketData, symbol }) => {
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<GenerateTradingSignalOutput | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  const getSignal = async () => {
    setLoading(true);
    setSignal(null);
    setExplanation(null);
    try {
      const result = await generateTradingSignals({
        symbol,
        interval: '1h',
        ohlcData: marketData.slice(-50),
        currentPrice: marketData[marketData.length - 1].close,
        technicalIndicators: {
          rsi: 65,
          bollingerBands: { upper: 48000, middle: 47000, lower: 46000 }
        }
      });
      setSignal(result);

      const exp = await explainTradingSignals({
        assetSymbol: symbol,
        signal: result.signal,
        confidenceScore: result.confidenceScore,
        detectedPatterns: ['Hammer', 'RSI Divergence'],
        technicalIndicators: [{ name: 'RSI', value: 65 }],
        priceMomentum: 'Strong Bullish'
      });
      setExplanation(exp.explanation);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="holographic-card h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-headline text-lg glow-blue flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              AI STRATEGY ENGINE
            </CardTitle>
            <CardDescription>Real-time pattern & indicator analysis</CardDescription>
          </div>
          <Button 
            onClick={getSignal} 
            disabled={loading}
            className="bg-primary hover:bg-primary/80 text-white border-none shadow-[0_0_15px_rgba(42,90,159,0.5)]"
          >
            {loading ? 'Analyzing...' : 'Generate Signal'}
            <Sparkles className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {signal && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-primary/20">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-headline">Action Signal</span>
                <div className="flex items-center gap-3">
                  <Badge className={`text-lg px-4 py-1 font-headline ${
                    signal.signal === 'Buy' ? 'bg-accent/20 text-accent border-accent' : 
                    signal.signal === 'Sell' ? 'bg-destructive/20 text-destructive border-destructive' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {signal.signal}
                  </Badge>
                  <span className="font-bold text-xl">{symbol}</span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-headline">Confidence</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-xl ${signal.confidenceScore > 75 ? 'text-accent' : 'text-primary'}`}>
                    {signal.confidenceScore}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-headline text-muted-foreground">
                <span>SIGNAL STRENGTH</span>
                <span>{signal.confidenceScore}%</span>
              </div>
              <Progress value={signal.confidenceScore} className="h-1.5" />
            </div>

            {explanation && (
              <div className="bg-primary/5 rounded-lg p-4 border-l-4 border-primary">
                <h4 className="text-sm font-headline text-primary flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" />
                  INTUITIVE BREAKDOWN
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{explanation}"
                </p>
              </div>
            )}
            
            <div className="space-y-2">
               <h4 className="text-sm font-headline text-muted-foreground flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  AI REASONING
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed font-body">
                  {signal.reasoning}
                </p>
            </div>
          </div>
        )}

        {!signal && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-headline text-sm">AWAITING INPUT</p>
            <p className="text-xs mt-2">Click generate to analyze current market conditions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};