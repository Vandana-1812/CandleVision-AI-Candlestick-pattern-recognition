'use server';
/**
 * @fileOverview A Genkit flow for generating student-friendly, step-wise explanations of AI-generated trading signals.
 */

import {ai} from '@/ai/genkit';
import {assertLlmFallbackEnabled} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainTradingSignalInputSchema = z.object({
  assetSymbol: z.string(),
  signal: z.string(),
  confidenceScore: z.number(),
  detectedPatterns: z.array(z.object({
    name: z.string(),
    confidence: z.number(),
    signal: z.string(),
    direction: z.string(),
  })),
  technicalIndicators: z.array(z.object({ name: z.string(), value: z.any() })),
  priceMomentum: z.string(),
  marketContext: z.string().optional(),
  signalContextJSON: z.string().optional(),
});
export type ExplainTradingSignalInput = z.infer<typeof ExplainTradingSignalInputSchema>;

const ExplainTradingSignalOutputSchema = z.object({
  summary: z.string().describe('A concise 1-sentence summary of the recommendation.'),
  steps: z.array(z.string()).describe('A step-by-step breakdown of the analysis points.'),
  conclusion: z.string().describe('A final actionable insight or risk warning.'),
});
export type ExplainTradingSignalOutput = z.infer<typeof ExplainTradingSignalOutputSchema>;

const explainTradingSignalPrompt = ai.definePrompt({
  name: 'explainTradingSignalPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {
    schema: z.object({
      assetSymbol: z.string(),
      signal: z.string(),
      confidenceScore: z.number(),
      detectedPatternsJSON: z.string(),
      technicalIndicatorsJSON: z.string(),
      priceMomentum: z.string(),
      marketContext: z.string().optional(),
      signalContextJSON: z.string().optional(),
    }),
  },
  output: {schema: ExplainTradingSignalOutputSchema},
  config: {
    responseMimeType: 'application/json',
  },
  prompt: `You are an expert financial analyst. Provide a concise, step-wise explanation for a '{{{signal}}}' signal on **{{{assetSymbol}}}**.

Confidence: {{confidenceScore}}%
Momentum: {{{priceMomentum}}}
Signal Context:
{{{signalContextJSON}}}

Detected Patterns:
{{{detectedPatternsJSON}}}

Technical Indicators:
{{{technicalIndicatorsJSON}}}

Constraints:
1. Break analysis into 3-5 clear steps.
2. One punchy summary sentence.
3. Final actionable conclusion.`,
});

const explainTradingSignalFlow = ai.defineFlow(
  {
    name: 'explainTradingSignalFlow',
    inputSchema: ExplainTradingSignalInputSchema,
    outputSchema: ExplainTradingSignalOutputSchema,
  },
  async (input) => {
    try {
      assertLlmFallbackEnabled('explainTradingSignalFlow');

      const {output} = await explainTradingSignalPrompt({
        assetSymbol: input.assetSymbol,
        signal: input.signal,
        confidenceScore: input.confidenceScore,
        detectedPatternsJSON: JSON.stringify(input.detectedPatterns),
        technicalIndicatorsJSON: JSON.stringify(input.technicalIndicators),
        priceMomentum: input.priceMomentum,
        marketContext: input.marketContext,
        signalContextJSON: input.signalContextJSON,
      });
      if (!output) throw new Error('AI returned empty response');
      return output;
    } catch (error) {
      console.error("Explanation AI failed:", error);
      return {
        summary: "Analysis currently unavailable.",
        steps: ["Market volatility is high.", "System is recalibrating data models.", "Please retry analysis shortly."],
        conclusion: "Monitor price action manually for the next interval."
      };
    }
  }
);

export async function explainTradingSignals(input: ExplainTradingSignalInput): Promise<ExplainTradingSignalOutput> {
  return explainTradingSignalFlow(input);
}
