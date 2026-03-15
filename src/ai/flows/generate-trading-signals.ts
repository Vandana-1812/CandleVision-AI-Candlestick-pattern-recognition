'use server';
/**
 * @fileOverview A Genkit flow for generating trading signals based on market data, patterns, and indicators.
 */

import { ai } from '@/ai/genkit';
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


/* ---------------- OUTPUT SCHEMA ---------------- */

const GenerateTradingSignalOutputSchema = z.object({
  signal: z.enum(['Buy', 'Sell', 'Hold']),
  confidenceScore: z.number().min(0).max(100),
  reasoning: z.string(),
});

export type GenerateTradingSignalOutput = z.infer<typeof GenerateTradingSignalOutputSchema>;


/* ---------------- PROMPT INPUT SCHEMA ---------------- */

const PromptInputSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  currentPrice: z.number(),
  technicalDataJSON: z.string(),
});


/* ---------------- PROMPT ---------------- */

const prompt = ai.definePrompt({
  name: 'generateTradingSignalPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: PromptInputSchema },
  output: { schema: GenerateTradingSignalOutputSchema },
  config: {
    responseMimeType: 'application/json',
  },

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

Return a JSON object with exactly these fields:
- signal: one of "Buy", "Sell", or "Hold"
- confidenceScore: a number between 0 and 100
- reasoning: a short string explaining the decision
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
    });

    try {

      const { output } = await prompt({
        symbol: input.symbol,
        interval: input.interval,
        currentPrice: input.currentPrice,
        technicalDataJSON,
      });

      if (!output) {
        throw new Error('AI returned empty response');
      }

      return output;

    } catch (error) {

      console.error("Trading signal AI failed:", error);

      // Only return fallback for transient / empty-response errors.
      // Re-throw config, auth, or quota errors so they surface properly.
      if (error instanceof Error && error.message === 'AI returned empty response') {
        return {
          signal: "Hold" as const,
          confidenceScore: 0,
          reasoning: "AI analysis unavailable. Defaulting to Hold.",
        };
      }

      throw error;
    }
  }
);


/* ---------------- EXPORTED FUNCTION ---------------- */

export async function generateTradingSignals(
  input: GenerateTradingSignalInput
): Promise<GenerateTradingSignalOutput> {

  return generateTradingSignalFlow(input);

}
