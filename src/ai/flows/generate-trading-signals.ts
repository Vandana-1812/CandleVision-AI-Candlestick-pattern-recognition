
'use server';
/**
 * @fileOverview A Genkit flow for generating trading signals based on market data, patterns, and indicators.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateTradingSignalInputSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  ohlcData: z.array(z.object({
    timestamp: z.string(),
    open: z.number(),
    high: z.number(),
    low: z.number(),
    close: z.number(),
    volume: z.number().optional(),
  })).min(1),
  technicalIndicators: z.object({
    rsi: z.number().optional(),
    bollingerBands: z.object({
      upper: z.number().optional(),
      middle: z.number().optional(),
      lower: z.number().optional(),
    }).optional(),
  }),
  currentPrice: z.number(),
});
export type GenerateTradingSignalInput = z.infer<typeof GenerateTradingSignalInputSchema>;

const GenerateTradingSignalOutputSchema = z.object({
  signal: z.enum(['Buy', 'Sell', 'Hold']),
  confidenceScore: z.number().min(0).max(100),
  reasoning: z.string(),
});
export type GenerateTradingSignalOutput = z.infer<typeof GenerateTradingSignalOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateTradingSignalPrompt',
  input: { schema: z.any() },
  output: { schema: GenerateTradingSignalOutputSchema },
  prompt: `You are an expert financial analyst. Analyze the following market data for {{{symbol}}} and provide a trading signal.

Current Price: {{{currentPrice}}}
Interval: {{{interval}}}

Technical Data:
{{{technicalDataJSON}}}

Provide your signal, confidence score, and concise reasoning.`,
});

const generateTradingSignalFlow = ai.defineFlow(
  {
    name: 'generateTradingSignalFlow',
    inputSchema: GenerateTradingSignalInputSchema,
    outputSchema: GenerateTradingSignalOutputSchema,
  },
  async (input) => {
    const technicalDataJSON = JSON.stringify({
      recentOHLC: input.ohlcData.slice(-10),
      indicators: input.technicalIndicators,
    });

    const { output } = await prompt({
      symbol: input.symbol,
      currentPrice: input.currentPrice,
      interval: input.interval,
      technicalDataJSON
    });
    return output!;
  }
);

export async function generateTradingSignals(input: GenerateTradingSignalInput): Promise<GenerateTradingSignalOutput> {
  return generateTradingSignalFlow(input);
}
