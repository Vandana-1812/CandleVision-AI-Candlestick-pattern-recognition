'use server';
/**
 * @fileOverview A Genkit flow for generating student-friendly, step-wise explanations of AI-generated trading signals.
 *
 * - explainTradingSignals - A function that generates a structured explanation for a trading signal.
 * - ExplainTradingSignalInput - The input type for the explainTradingSignals function.
 * - ExplainTradingSignalOutput - The return type for the explainTradingSignals function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainTradingSignalInputSchema = z.object({
  assetSymbol: z.string(),
  signal: z.string(),
  confidenceScore: z.number(),
  detectedPatterns: z.array(z.string()),
  technicalIndicators: z.array(z.object({ name: z.string(), value: z.any() })),
  priceMomentum: z.string(),
  marketContext: z.string().optional(),
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
  model: 'googleai/gemini-2.0-flash',
  input: {schema: ExplainTradingSignalInputSchema},
  output: {schema: ExplainTradingSignalOutputSchema},
  prompt: `You are an expert financial analyst. Provide a concise, step-wise explanation for a '{{{signal}}}' signal on **{{{assetSymbol}}}**.

Confidence: {{confidenceScore}}%
Momentum: {{{priceMomentum}}}

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
    const {output} = await explainTradingSignalPrompt(input);
    return output!;
  }
);

export async function explainTradingSignals(input: ExplainTradingSignalInput): Promise<ExplainTradingSignalOutput> {
  return explainTradingSignalFlow(input);
}
