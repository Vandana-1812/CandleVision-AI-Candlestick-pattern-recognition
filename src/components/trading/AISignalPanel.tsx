"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  BrainCircuit,
  Info,
  CheckCircle2,
  Loader2,
  Cpu
} from 'lucide-react';
import { explainTradingSignals } from '@/ai/flows/explain-trading-signals';
import { 
  Sparkles, 
  BrainCircuit, 
  Info, 
  CheckCircle2, 
  Loader2, 
  Cpu
} from 'lucide-react';
import { generateTradingSignals } from '@/ai/flows/generate-trading-signals';
import { OHLC, calculateRSI, calculateMACD, calculateBollingerBands } from '@/lib/market-data';
import { saveSignalRecord } from '@/lib/signal-repository';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';

interface AISignalPanelProps {
  marketData: OHLC[];
  symbol: string;
}

interface ModelSignalResponse {
  stock: string;
  pattern: string;
  confidence: number;
  confidenceScore: number;
  signal: 'Buy' | 'Sell' | 'Hold';
  reasoning: string;
const SIGNAL_GENERATION_TIMEOUT_MS = 130000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export const AISignalPanel: React.FC<AISignalPanelProps> = ({ marketData, symbol }) => {
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<ModelSignalResponse | null>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const getSignal = async () => {
    if (!marketData.length) {
      toast({ title: "Insufficient Data", description: "Wait for market stream to initialize.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setSignal(null);
    setExplanation(null);

    try {
      const currentPrice = marketData[marketData.length - 1].close;
      const analysisWindow = Math.min(marketData.length, 90);
      const sequenceWindow = Math.min(analysisWindow, 60);

      // Calculate real technical indicators from market data
      const rsiValues = calculateRSI(marketData);
      const macdValues = calculateMACD(marketData);
      const bbValues = calculateBollingerBands(marketData);
      const lastIdx = marketData.length - 1;
      const currentRSI = rsiValues[lastIdx];
      const currentMACD = macdValues[lastIdx];
      const currentBB = bbValues[lastIdx];
      const priceMomentum =
        currentMACD.macd > currentMACD.signal
          ? 'Bullish'
          : currentMACD.macd < currentMACD.signal
          ? 'Bearish'
          : 'Neutral';

      // Step 1: Generate Raw Signal
      const result = await withTimeout(
        generateTradingSignals({
          symbol,
          interval: '1h',
          ohlcData: marketData.slice(-sequenceWindow),
          currentPrice,
          technicalIndicators: {
            rsi: currentRSI,
            macd: {
              line: currentMACD.macd,
              signal: currentMACD.signal,
              histogram: currentMACD.histogram,
            },
            bollingerBands: {
              upper: currentBB.upper,
              middle: currentBB.middle,
              lower: currentBB.lower,
            },
          },
        }),
        SIGNAL_GENERATION_TIMEOUT_MS,
        'Model inference is taking longer than expected.'
      );
      setSignal(result);

      // Render the core signal immediately; explanation can arrive later.
      setExplanation({
        summary: result.reasoning,
        steps: result.explanationDetails?.length
          ? result.explanationDetails
          : ['Pattern and technical analysis completed.'],
        conclusion: `Suggested action: ${result.signal}`,
      });

      // Step 2: Store Signal for Verification
      if (user && db) {
        try {
          void saveSignalRecord(db, user.uid, {
            symbol,
            signal: result.signal,
            entryPrice: currentPrice,
            confidenceScore: result.confidenceScore,
            inferenceModel: result.inferenceModel,
            reasoning: result.reasoning,
            patternDetected: result.patternDetected,
            patternConfidence: result.patternConfidence,
            technicalAlignment: result.technicalAlignment,
            detectedPatterns: result.detectedPatterns,
            patternSummary: result.patternSummary,
            technicalSummary: result.technicalSummary,
            explanationDetails: result.explanationDetails,
            signalContractVersion: result.signalContractVersion,
          }).catch((persistenceError) => {
            console.warn('Signal persistence failed; continuing with in-memory output.', persistenceError);
          });
        } catch (persistenceError) {
          console.warn('Signal persistence failed; continuing with in-memory output.', persistenceError);
        }
      }

    } catch (error: any) {
      console.error("Signal Generation Error:", error);
      const friendlyDescription =
        typeof error?.message === 'string' && error.message.toLowerCase().includes('timed out')
          ? 'Model engine is warming up. Please try again in a few seconds.'
          : 'Unable to generate a signal right now. Please try again shortly.';

      toast({
        variant: "destructive",
        title: "Intelligence Pipeline Error",
        description: friendlyDescription,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="holographic-card h-full flex flex-col border-primary/20">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="font-headline text-lg glow-blue flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              AI STRATEGY TERMINAL
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-wider">Model Inference Engine Active</CardDescription>
          </div>
          <Button
            onClick={getSignal}
            disabled={loading || !marketData.length}
            className="bg-primary hover:bg-primary/80 text-white border-none shadow-[0_0_15px_rgba(42,90,159,0.5)] h-9 px-4 text-xs font-headline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 w-3 h-3 animate-spin" />
                ANALYZING...
              </>
            ) : (
              <>
                GENERATE SIGNAL
                <Sparkles className="ml-2 w-3 h-3" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-6 scrollbar-hide">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Cpu className="w-6 h-6 text-primary animate-bounce" />
            </div>
            <p className="font-headline text-[10px] text-muted-foreground uppercase tracking-widest">Processing Market Context...</p>
          </div>
        )}

        {signal && explanation && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-background/40 border border-white/5 space-y-1">
                <p className="text-[10px] font-headline text-muted-foreground uppercase">Action</p>
                <Badge className={`text-lg px-4 py-0 font-headline h-8 w-full justify-center ${
                  signal.signal === 'Buy' ? 'bg-accent/20 text-accent border-accent/50' :
                  signal.signal === 'Sell' ? 'bg-destructive/20 text-destructive border-destructive/50' :
                  'bg-muted/20 text-muted-foreground border-white/10'
                }`}>
                  {signal.signal}
                </Badge>
              </div>
              <div className="p-4 rounded-xl bg-background/40 border border-white/5 space-y-1">
                <p className="text-[10px] font-headline text-muted-foreground uppercase">Confidence</p>
                <div className="flex items-center justify-between h-8">
                  <span className={`font-bold text-xl font-headline ${signal.confidenceScore > 75 ? 'text-accent' : 'text-primary'}`}>
                    {signal.confidenceScore}%
                  </span>
                  <div className="h-1.5 w-12 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${signal.confidenceScore}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-background/40 border border-white/5 space-y-1">
              <p className="text-[10px] font-headline text-muted-foreground uppercase">Detected Pattern</p>
              <p className="font-headline text-base text-primary">{signal.pattern}</p>
            <div className="p-3 rounded-xl bg-background/40 border border-white/5 flex items-center justify-between">
              <p className="text-[10px] font-headline text-muted-foreground uppercase">Inference Model</p>
              <Badge className={`text-[10px] px-2.5 py-1 font-headline border ${
                signal.inferenceModel === 'LSTM'
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : signal.inferenceModel === 'CNN'
                  ? 'bg-accent/20 text-accent border-accent/40'
                  : signal.inferenceModel === 'YOLO'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-muted/20 text-muted-foreground border-white/10'
              }`}>
                {signal.inferenceModel ?? 'UNKNOWN'}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <h4 className="text-[10px] font-headline text-primary mb-2 uppercase flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  Executive Summary
                </h4>
                <p className="text-sm font-medium leading-relaxed italic text-foreground/90">
                  "{explanation.summary}"
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-headline text-muted-foreground uppercase flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-accent" />
                  Analysis Breakdown
                </h4>
                <div className="space-y-3">
                  {explanation.steps.map((step: string, idx: number) => (
                    <div key={idx} className="flex gap-3 group">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-headline text-muted-foreground group-hover:border-primary/50 transition-colors">
                          {idx + 1}
                        </div>
                        {idx !== explanation.steps.length - 1 && <div className="w-px flex-1 bg-white/5" />}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pt-0.5 group-hover:text-foreground/80 transition-colors">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!signal && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <div className="relative mb-6">
              <BrainCircuit className="w-16 h-16 text-primary" />
              <div className="absolute inset-0 bg-primary/20 blur-2xl -z-10" />
            </div>
            <p className="font-headline text-xs tracking-widest text-muted-foreground">WAITING FOR OPERATIVE INPUT</p>
            <p className="text-[10px] mt-2 max-w-[200px] leading-relaxed">
              Click generate to initialize neural analysis and start verification tracking.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
