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

const GenerateTradingSignalInputSchema = z.object({
  symbol: z.string().describe('The financial instrument symbol (e.g., BTC/USD, AAPL).'),
  interval: z.string().describe('The time interval of the OHLC data (e.g., 1d, 4h, 1h).'),
  ohlcData: z.array(z.object({
    timestamp: z.string().datetime().describe('Timestamp of the OHLC bar in ISO 8601 format.'),
    open: z.number().describe('Opening price.'),
    high: z.number().describe('Highest price.'),
    low: z.number().describe('Lowest price.'),
    close: z.number().describe('Closing price.'),
    volume: z.number().optional().describe('Trading volume for the period.'),
  })).min(1).describe('Array of historical OHLC market data, sorted chronologically.').max(100, 'Max 100 OHLC bars allowed to prevent exceeding prompt limits.'),
  detectedPatterns: z.array(z.object({
    name: z.string().describe('Name of the detected candlestick pattern (e.g., Hammer, Doji, Engulfing).'),
    type: z.enum(['bullish', 'bearish', 'neutral']).describe('The bullish/bearish/neutral nature of the pattern.'),
    atIndex: z.number().describe('The index of the OHLC bar where the pattern was detected in the ohlcData array.'),
  })).optional().describe('List of recently detected candlestick patterns.'),
  technicalIndicators: z.object({
    rsi: z.number().optional().describe('Relative Strength Index.'),
    macd: z.object({
      line: z.number().optional().describe('MACD Line.'),
      signal: z.number().optional().describe('Signal Line.'),
      histogram: z.number().optional().describe('MACD Histogram.'),
    }).optional().describe('Moving Average Convergence Divergence.'),
    sma: z.record(z.string(), z.number()).optional().describe('Simple Moving Averages (e.g., {"sma20": 123.45}).'),
    ema: z.record(z.string(), z.number()).optional().describe('Exponential Moving Averages (e.g., {"ema50": 123.45}).'),
    bollingerBands: z.object({
      upper: z.number().optional().describe('Bollinger Band Upper.'),
      middle: z.number().optional().describe('Bollinger Band Middle (SMA).'),
      lower: z.number().optional().describe('Bollinger Band Lower.'),
    }).optional().describe('Bollinger Bands.'),
  }).describe('Key technical indicator values based on the OHLC data.'),
  currentPrice: z.number().describe('The most recent closing price of the asset.'),
});
export type GenerateTradingSignalInput = z.infer<typeof GenerateTradingSignalInputSchema>;

const GenerateTradingSignalOutputSchema = z.object({
  signal: z.enum(['Buy', 'Sell', 'Hold']).describe('The recommended trading signal.'),
  confidenceScore: z.number().min(0).max(100).describe('A confidence score (0-100) for the generated signal.'),
  reasoning: z.string().describe('A detailed explanation for the generated signal, referencing the market data, patterns, and indicators.'),
});
export type GenerateTradingSignalOutput = z.infer<typeof GenerateTradingSignalOutputSchema>;

// Define a schema for the prompt's specific input, which includes summarized OHLC data for brevity.
const GenerateTradingSignalPromptInputSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  ohlcDataSummarized: z.string().describe('A JSON string representing the recent OHLC data.'),
  detectedPatterns: z.array(z.object({
    name: z.string(),
    type: z.enum(['bullish', 'bearish', 'neutral']),
    atIndex: z.number(),
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
  currentPrice: z.number(),
});
type GenerateTradingSignalPromptInput = z.infer<typeof GenerateTradingSignalPromptInputSchema>;

const prompt = ai.definePrompt({
  name: 'generateTradingSignalPrompt',
  input: { schema: GenerateTradingSignalPromptInputSchema },
  output: { schema: GenerateTradingSignalOutputSchema },
  prompt: `You are an expert financial analyst for the CandleVision platform. Your task is to meticulously analyze the provided market data, detected candlestick patterns, and technical indicators to generate a clear 'Buy', 'Sell', or 'Hold' trading signal. Provide a confidence score (0-100) and a detailed explanation for your decision.

Market Symbol: {{{symbol}}}
Time Interval: {{{interval}}}
Current Price: {{{currentPrice}}}

---
Recent OHLC Data (JSON format):
{{{ohlcDataSummarized}}}

---
Detected Candlestick Patterns:
{{#if detectedPatterns}}
  {{#each detectedPatterns}}
    - Name: {{name}}, Type: {{type}}, Detected at OHLC Index: {{atIndex}}
  {{/each}}
{{else}}
  No significant patterns detected recently.
{{/if}}

---
Technical Indicators:
{{#with technicalIndicators}}
  RSI: {{rsi}}
  MACD: Line: {{macd.line}}, Signal: {{macd.signal}}, Histogram: {{macd.histogram}}
  Simple Moving Averages: {{#if sma}}{{#each sma}} {{key}}: {{this}} {{/each}}{{else}}N/A{{/if}}
  Exponential Moving Averages: {{#if ema}}{{#each ema}} {{key}}: {{this}} {{/each}}{{else}}N/A{{/if}}
  Bollinger Bands: Upper: {{bollingerBands.upper}}, Middle: {{bollingerBands.middle}}, Lower: {{bollingerBands.lower}}
{{/with}}

---
Based on this information, provide your signal, confidence score, and detailed reasoning.`,
});

const generateTradingSignalFlow = ai.defineFlow(
  {
    name: 'generateTradingSignalFlow',
    inputSchema: GenerateTradingSignalInputSchema,
    outputSchema: GenerateTradingSignalOutputSchema,
  },
  async (input) => {
    // Take the last 10 entries of OHLC data to ensure the prompt remains concise
    // and focuses on recent market action, avoiding potential token limits.
    const recentOhlcData = input.ohlcData.slice(-10);
    const ohlcDataSummarized = JSON.stringify(recentOhlcData, null, 2);

    // Prepare the input for the prompt, matching GenerateTradingSignalPromptInputSchema.
    const promptInput: GenerateTradingSignalPromptInput = {
      symbol: input.symbol,
      interval: input.interval,
      ohlcDataSummarized: ohlcDataSummarized,
      detectedPatterns: input.detectedPatterns,
      technicalIndicators: input.technicalIndicators,
      currentPrice: input.currentPrice,
    };

    const { output } = await prompt(promptInput);
    return output!;
  }
);

export async function generateTradingSignals(input: GenerateTradingSignalInput): Promise<GenerateTradingSignalOutput> {
  return generateTradingSignalFlow(input);
}
