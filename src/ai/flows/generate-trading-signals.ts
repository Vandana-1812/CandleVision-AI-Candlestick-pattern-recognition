'use server';
/**
 * @fileOverview A Genkit flow for generating trading signals based on market data, patterns, and indicators.
 *
 * - generateTradingSignals - A function that handles the trading signal generation process.
 * - GenerateTradingSignalInput - The input type for the generateTradingSignals function.
 * - GenerateTradingSignalOutput - The return type for the generateTradingSignals function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/* ---------------- INPUT SCHEMA ---------------- */

const GenerateTradingSignalInputSchema = z.object({
  symbol: z.string().describe('The financial instrument symbol (e.g., BTC/USD, AAPL).'),
  interval: z.string().describe('The time interval of the OHLC data (e.g., 1d, 4h, 1h).'),
  ohlcData: z.array(
    z.object({
      timestamp: z.string().describe('Timestamp of the OHLC bar in ISO 8601 format.'),
      open: z.number().describe('Opening price.'),
      high: z.number().describe('Highest price.'),
      low: z.number().describe('Lowest price.'),
      close: z.number().describe('Closing price.'),
      volume: z.number().optional().describe('Trading volume for the period.'),
    })
  ).min(1).describe('Array of historical OHLC market data, sorted chronologically.').max(100),
  detectedPatterns: z.array(z.object({
    name: z.string().describe('Name of the detected candlestick pattern.'),
    type: z.enum(['bullish', 'bearish', 'neutral']).describe('The bullish/bearish/neutral nature of the pattern.'),
    atIndex: z.number().describe('The index of the OHLC bar where the pattern was detected.'),
  })).optional(),
  technicalIndicators: z.object({
    rsi: z.number().optional(),
    macd: z.object({
      line: z.number().optional(),
      signal: z.number().optional(),
      histogram: z.number().optional(),
    }).optional(),
    sma: z.record(z.string(), z.number()).optional(),
    ema: z.record(z.string(), z.number()).optional(),
    bollingerBands: z.object({
      upper: z.number().optional(),
      middle: z.number().optional(),
      lower: z.number().optional(),
    }).optional(),
  }),
  currentPrice: z.number().describe('The most recent closing price of the asset.'),
});

export type GenerateTradingSignalInput = z.infer<typeof GenerateTradingSignalInputSchema>;


/* ---------------- OUTPUT SCHEMA ---------------- */

const GenerateTradingSignalOutputSchema = z.object({
  signal: z.enum(['Buy', 'Sell', 'Hold']).describe('The recommended trading signal.'),
  confidenceScore: z.number().min(0).max(100).describe('A confidence score (0-100) for the generated signal.'),
  reasoning: z.string().describe('A detailed explanation for the generated signal.'),
});

export type GenerateTradingSignalOutput = z.infer<typeof GenerateTradingSignalOutputSchema>;


/* ---------------- PROMPT INPUT SCHEMA (IMPORTANT) ---------------- */

const PromptInputSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  currentPrice: z.number(),
  technicalDataJSON: z.string(),
});


/* ---------------- PROMPT ---------------- */

const prompt = ai.definePrompt({
  name: 'generateTradingSignalPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: PromptInputSchema },
  output: { schema: GenerateTradingSignalOutputSchema },

  prompt: `
You are an expert financial analyst.

Analyze the following market data and generate a trading signal.

Symbol: {{symbol}}
Current Price: {{currentPrice}}
Interval: {{interval}}

Technical Market Data:
{{technicalDataJSON}}

Decision rules:

BUY → bullish indicators and upward momentum  
SELL → bearish indicators and downward momentum  
HOLD → mixed signals or unclear trend  

Return:

1. Trading signal (Buy / Sell / Hold)
2. Confidence score (0–100)
3. Short reasoning explaining the decision.
`,
});


/* ---------------- FLOW ---------------- */

const generateTradingSignalFlow = ai.defineFlow(
  {
    name: 'generateTradingSignalFlow',
    inputSchema: GenerateTradingSignalInputSchema,
    outputSchema: GenerateTradingSignalOutputSchema,
  },
  async (input) => {

    const technicalDataJSON = JSON.stringify({
      recentCandles: input.ohlcData.slice(-10),
      indicators: input.technicalIndicators ?? {},
      patterns: input.detectedPatterns ?? []
    });

    try {

      const { output } = await prompt({
        symbol: input.symbol,
        interval: input.interval,
        currentPrice: input.currentPrice,
        technicalDataJSON
      });

      if (!output) {
        throw new Error('AI returned empty response');
      }

      return output;

    } catch (error) {

      console.error("Trading signal AI failed:", error);

      // fallback response so app doesn't crash
      return {
        signal: "Hold",
        confidenceScore: 0,
        reasoning: "AI analysis unavailable. Defaulting to Hold."
      };

    }
  }
);


/* ---------------- EXPORTED FUNCTION ---------------- */

export async function generateTradingSignals(
  input: GenerateTradingSignalInput
): Promise<GenerateTradingSignalOutput> {

  return generateTradingSignalFlow(input);

}