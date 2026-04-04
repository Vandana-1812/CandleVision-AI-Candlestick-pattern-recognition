'use server';
/**
 * @fileOverview A Genkit flow for generating trading signals based on YOLOv8 pattern detection,
 * technical indicators, and AI analysis. Enhanced with candlestick pattern recognition.
 */

import { ai } from '@/ai/genkit';
import { detectCandlestickPatterns, type PatternDetectionResponse } from '@/lib/pattern-detection';
import { z } from 'genkit';

/* ---------------- INPUT SCHEMA ---------------- */

const GenerateTradingSignalInputSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  ohlcData: z.array(
    z.object({
      timestamp: z.string(),
      open: z.number(),
      high: z.number(),
      low: z.number(),
      close: z.number(),
      volume: z.number().optional(),
    })
  ).min(1),
  technicalIndicators: z.object({
    rsi: z.number().optional(),
    macd: z
      .object({
        line: z.number().optional(),
        signal: z.number().optional(),
        histogram: z.number().optional(),
      })
      .optional(),
    bollingerBands: z
      .object({
        upper: z.number().optional(),
        middle: z.number().optional(),
        lower: z.number().optional(),
      })
      .optional(),
  }),
  currentPrice: z.number(),
});

export type GenerateTradingSignalInput = z.infer<typeof GenerateTradingSignalInputSchema>;


/* ---------------- OUTPUT SCHEMA (ENHANCED WITH PATTERN DATA) ---------------- */

const GenerateTradingSignalOutputSchema = z.object({
  signal: z.enum(['Buy', 'Sell', 'Hold']),
  confidenceScore: z.number().min(0).max(100),
  inferenceModel: z.enum(['CNN', 'LSTM', 'YOLO', 'FALLBACK']),
  reasoning: z.string(),
  patternDetected: z.string().optional(),
  patternConfidence: z.number().optional(),
  detectedPatterns: z.array(z.object({
    name: z.string(),
    confidence: z.number(),
    signal: z.enum(['Buy', 'Sell', 'Hold']),
    direction: z.enum(['bullish', 'bearish', 'neutral']),
    patternId: z.number().optional(),
    isStrongSignal: z.boolean().optional(),
  })),
  technicalAlignment: z.number().optional(),
  patternSummary: z.object({
    dominantSignal: z.enum(['Buy', 'Sell', 'Hold']),
    confidence: z.number(),
    totalPatterns: z.number(),
    bullishPatterns: z.array(z.object({ name: z.string(), confidence: z.number() })),
    bearishPatterns: z.array(z.object({ name: z.string(), confidence: z.number() })),
    neutralPatterns: z.array(z.object({ name: z.string(), confidence: z.number() })),
    strongSignals: z.array(z.object({ name: z.string(), confidence: z.number() })),
  }),
  technicalSummary: z.object({
    rsi: z.number().optional(),
    macd: z.object({
      line: z.number().optional(),
      signal: z.number().optional(),
      histogram: z.number().optional(),
    }).optional(),
    bollingerBands: z.object({
      upper: z.number().optional(),
      middle: z.number().optional(),
      lower: z.number().optional(),
    }).optional(),
    momentum: z.enum(['Bullish', 'Bearish', 'Neutral']),
    alignmentScore: z.number(),
  }),
  explanationDetails: z.array(z.string()),
  signalContractVersion: z.literal('v2'),
});

export type GenerateTradingSignalOutput = z.infer<typeof GenerateTradingSignalOutputSchema>;


/* ---------------- FLOW (ENHANCED WITH PATTERN DETECTION) ---------------- */

const generateTradingSignalFlow = ai.defineFlow(
  {
    name: 'generateTradingSignalFlow',
    inputSchema: GenerateTradingSignalInputSchema,
    outputSchema: GenerateTradingSignalOutputSchema,
  },
  async (input) => {
    try {
      const sequenceLength = input.ohlcData.length >= 60 ? 60 : 30;
      const modelType = input.ohlcData.length >= 60 ? 'lstm' : 'cnn';
      let patternDetectionData: PatternDetectionResponse;

      try {
        patternDetectionData = await detectCandlestickPatterns({
          symbol: input.symbol,
          interval: input.interval,
          ohlcData: input.ohlcData.slice(-sequenceLength),
          modelType,
        });
      } catch (primaryError) {
        // LSTM can intermittently stall on first-load CPU paths; retry with CNN for continuity.
        if (modelType === 'lstm') {
          console.warn('LSTM inference failed, retrying with CNN:', primaryError);
          patternDetectionData = await detectCandlestickPatterns({
            symbol: input.symbol,
            interval: input.interval,
            ohlcData: input.ohlcData.slice(-30),
            modelType: 'cnn',
          });
        } else {
          throw primaryError;
        }
      }

      const technicalSummary = summarizeTechnicalIndicators(input);
      return composeSignalContract(patternDetectionData, technicalSummary, input.currentPrice);

    } catch (error) {
      console.error("Trading signal AI failed:", error);

      // Fallback for transient errors
      return buildFallbackSignal(input, String(error));
    }
  }
);


/* ---------------- EXPORTED FUNCTION ---------------- */

export async function generateTradingSignals(
  input: GenerateTradingSignalInput
): Promise<GenerateTradingSignalOutput> {

  return generateTradingSignalFlow(input);

}

type SignalDirection = 'Buy' | 'Sell' | 'Hold';

function buildFallbackSignal(input: GenerateTradingSignalInput, errorMessage: string): GenerateTradingSignalOutput {
  console.error('buildFallbackSignal invoked:', errorMessage);

  const technicalSummary = summarizeTechnicalIndicators(input);
  const patternSummary = {
    dominantSignal: 'Hold' as const,
    confidence: 0,
    totalPatterns: 0,
    bullishPatterns: [],
    bearishPatterns: [],
    neutralPatterns: [],
    strongSignals: [],
  };

  return {
    signal: 'Hold',
    confidenceScore: 0,
    inferenceModel: 'FALLBACK',
    reasoning: 'AI analysis unavailable. Defaulting to Hold while the model engine recovers.',
    patternDetected: undefined,
    patternConfidence: 0,
    detectedPatterns: [],
    technicalAlignment: technicalSummary.alignmentScore,
    patternSummary,
    technicalSummary,
    explanationDetails: ['Live reasoning generation was unavailable.', 'The signal was downgraded to Hold for safety.'],
    signalContractVersion: 'v2',
  };
}

function summarizeTechnicalIndicators(input: GenerateTradingSignalInput) {
  const rsi = input.technicalIndicators?.rsi;
  const macd = input.technicalIndicators?.macd;
  const bollingerBands = input.technicalIndicators?.bollingerBands;

  const momentum = deriveMomentum(rsi, macd?.histogram);
  const alignmentScore = calculateTechnicalAlignment(rsi, macd?.histogram, bollingerBands, input.currentPrice);

  return {
    rsi,
    macd,
    bollingerBands,
    momentum,
    alignmentScore,
  };
}

function deriveMomentum(rsi?: number, histogram?: number): 'Bullish' | 'Bearish' | 'Neutral' {
  if (typeof rsi === 'number') {
    if (rsi < 30) return 'Bullish';
    if (rsi > 70) return 'Bearish';
  }

  if (typeof histogram === 'number') {
    if (histogram > 0) return 'Bullish';
    if (histogram < 0) return 'Bearish';
  }

  return 'Neutral';
}

function calculateTechnicalAlignment(
  rsi?: number,
  histogram?: number,
  bollingerBands?: { upper?: number; middle?: number; lower?: number },
  currentPrice?: number,
): number {
  const scores: number[] = [];

  if (typeof rsi === 'number') {
    if (rsi < 30 || rsi > 70) {
      scores.push(0.8);
    } else {
      scores.push(0.4);
    }
  }

  if (typeof histogram === 'number') {
    scores.push(Math.min(Math.abs(histogram) / 5, 1));
  }

  if (bollingerBands && typeof currentPrice === 'number') {
    const bandRange = (bollingerBands.upper ?? currentPrice) - (bollingerBands.lower ?? currentPrice);
    if (bandRange > 0) {
      const relativePosition = (currentPrice - (bollingerBands.lower ?? currentPrice)) / bandRange;
      scores.push(relativePosition < 0.25 || relativePosition > 0.75 ? 0.75 : 0.45);
    }
  }

  if (scores.length === 0) {
    return 0.5;
  }

  return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));
}

function composeSignalContract(
  patternDetectionData: PatternDetectionResponse,
  technicalSummary: ReturnType<typeof summarizeTechnicalIndicators>,
  currentPrice: number,
): GenerateTradingSignalOutput {
  const detectedPatterns = normalizeDetectedPatterns(patternDetectionData);
  const lstmSignal = patternDetectionData.lstmSignal;
  const patternSignal = lstmSignal?.direction ?? patternDetectionData.dominantSignal;
  const technicalSignal = technicalSummary.momentum === 'Bullish' ? 'Buy' : technicalSummary.momentum === 'Bearish' ? 'Sell' : 'Hold';

  const scoreMap: Record<SignalDirection, number> = { Buy: 0, Sell: 0, Hold: 0 };
  const patternWeight = Math.max(patternDetectionData.confidence, 0.1);
  const technicalWeight = Math.max(technicalSummary.alignmentScore, 0.1);
  const sequenceWeight = lstmSignal ? Math.max(lstmSignal.confidence, 0.1) : 0;

  scoreMap[patternSignal] += patternWeight * 0.7;
  if (lstmSignal) {
    scoreMap[lstmSignal.direction] += sequenceWeight * 0.75;
  }
  scoreMap[technicalSignal] += technicalWeight * 0.6;

  if (patternSignal === technicalSignal && patternSignal !== 'Hold') {
    scoreMap[patternSignal] += 0.2;
  }

  if (lstmSignal && lstmSignal.direction === technicalSignal && lstmSignal.direction !== 'Hold') {
    scoreMap[lstmSignal.direction] += 0.15;
  }

  const finalSignal = (Object.entries(scoreMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Hold') as SignalDirection;
  const confidenceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (Math.max(patternDetectionData.confidence, technicalSummary.alignmentScore) * 70) +
          (finalSignal === patternSignal && finalSignal === technicalSignal ? 20 : 0) +
          (patternDetectionData.totalPatterns > 0 ? 10 : 0)
      )
    )
  );

  const primaryPattern = detectedPatterns[0];
  const explanationDetails = buildExplanationDetails(patternDetectionData, technicalSummary, finalSignal, currentPrice);
  const inferenceModel = patternDetectionData.lstmSignal ? 'LSTM' : detectedPatterns.length > 0 ? 'CNN' : 'YOLO';
  const reasoning = buildDeterministicReasoning(finalSignal, inferenceModel, patternDetectionData, technicalSummary, currentPrice);

  return {
    signal: finalSignal,
    confidenceScore,
    inferenceModel,
    reasoning,
    patternDetected: primaryPattern?.name,
    patternConfidence: primaryPattern?.confidence,
    detectedPatterns,
    technicalAlignment: technicalSummary.alignmentScore,
    patternSummary: {
      dominantSignal: patternDetectionData.dominantSignal,
      confidence: patternDetectionData.confidence,
      totalPatterns: patternDetectionData.totalPatterns,
      bullishPatterns: patternDetectionData.bullishPatterns,
      bearishPatterns: patternDetectionData.bearishPatterns,
      neutralPatterns: patternDetectionData.neutralPatterns ?? [],
      strongSignals: patternDetectionData.strongSignals,
    },
    technicalSummary,
    explanationDetails,
    signalContractVersion: 'v2',
  };
}

function normalizeDetectedPatterns(patternDetectionData: PatternDetectionResponse) {
  const bullish = patternDetectionData.bullishPatterns.map((pattern) => ({
    name: pattern.name,
    confidence: pattern.confidence,
    signal: 'Buy' as const,
    direction: 'bullish' as const,
  }));
  const bearish = patternDetectionData.bearishPatterns.map((pattern) => ({
    name: pattern.name,
    confidence: pattern.confidence,
    signal: 'Sell' as const,
    direction: 'bearish' as const,
  }));
  const neutral = (patternDetectionData.neutralPatterns ?? []).map((pattern) => ({
    name: pattern.name,
    confidence: pattern.confidence,
    signal: 'Hold' as const,
    direction: 'neutral' as const,
  }));

  const strongSignals = new Set(patternDetectionData.strongSignals.map((pattern) => pattern.name));

  return [...bullish, ...bearish, ...neutral].map((pattern, index) => ({
    ...pattern,
    patternId: index,
    isStrongSignal: strongSignals.has(pattern.name),
  }));
}

function buildExplanationDetails(
  patternDetectionData: PatternDetectionResponse,
  technicalSummary: ReturnType<typeof summarizeTechnicalIndicators>,
  finalSignal: SignalDirection,
  currentPrice: number,
) {
  const details = [
    `Final signal: ${finalSignal} at ${currentPrice.toFixed(2)}`,
    `Pattern alignment: ${patternDetectionData.dominantSignal} with ${patternDetectionData.totalPatterns} detected patterns`,
    `Technical momentum: ${technicalSummary.momentum} with alignment ${Math.round(technicalSummary.alignmentScore * 100)}%`,
  ];

  if (patternDetectionData.lstmSignal) {
    details.push(
      `LSTM sequence verdict: ${patternDetectionData.lstmSignal.direction} with ${(patternDetectionData.lstmSignal.confidence * 100).toFixed(1)}% confidence over ${patternDetectionData.lstmSignal.sequenceLength} candles`
    );
  }

  if (patternDetectionData.strongSignals.length > 0) {
    details.push(`Strong signals: ${patternDetectionData.strongSignals.map((pattern) => pattern.name).join(', ')}`);
  }

  return details;
}

function buildDeterministicReasoning(
  finalSignal: SignalDirection,
  inferenceModel: 'CNN' | 'LSTM' | 'YOLO',
  patternDetectionData: PatternDetectionResponse,
  technicalSummary: ReturnType<typeof summarizeTechnicalIndicators>,
  currentPrice: number,
): string {
  const patternSegment = patternDetectionData.totalPatterns
    ? `${patternDetectionData.totalPatterns} pattern signals were detected with ${Math.round(patternDetectionData.confidence * 100)}% model confidence`
    : 'no high-confidence pattern signals were detected';

  const technicalSegment = `technical momentum is ${technicalSummary.momentum.toLowerCase()} with alignment ${Math.round(
    technicalSummary.alignmentScore * 100
  )}%`;

  const lstmSegment = patternDetectionData.lstmSignal
    ? `sequence model verdict is ${patternDetectionData.lstmSignal.direction} at ${Math.round(
        patternDetectionData.lstmSignal.confidence * 100
      )}%`
    : 'sequence model was not used for this window';

  return `${finalSignal} at ${currentPrice.toFixed(2)} based on ${inferenceModel} inference: ${patternSegment}; ${technicalSegment}; ${lstmSegment}.`;
}
