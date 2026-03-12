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
  assetSymbol: z.string().describe('The ticker symbol or name of the asset.'),
  signal: z.string().describe('The trading signal (e.g., "Buy", "Sell", "Hold").'),
  confidenceScore: z.number().describe('The confidence score for the signal (0-100).'),
  detectedPatterns: z.array(z.string()).describe('List of detected candlestick patterns.'),
  technicalIndicators: z
    .array(
      z.object({
        name: z.string().describe('The name of the technical indicator.'),
        value: z.any().describe('The value of the technical indicator.'),
      })
    )
    .describe('An array of technical indicators and their values.'),
  priceMomentum: z.string().describe('Description of current price momentum.'),
  marketContext: z
    .string()
    .optional()
    .describe('Optional additional market context.'),
});
export type ExplainTradingSignalInput = z.infer<
  typeof ExplainTradingSignalInputSchema
>;

const ExplainTradingSignalOutputSchema = z.object({
  summary: z.string().describe('A concise 1-sentence summary of the recommendation.'),
  steps: z.array(z.string()).describe('A step-by-step breakdown of the analysis points.'),
  conclusion: z.string().describe('A final actionable insight or risk warning.'),
});
export type ExplainTradingSignalOutput = z.infer<
  typeof ExplainTradingSignalOutputSchema
>;

export async function explainTradingSignals(
  input: ExplainTradingSignalInput
): Promise<ExplainTradingSignalOutput> {
  return explainTradingSignalFlow(input);
}

const explainTradingSignalPrompt = ai.definePrompt({
  name: 'explainTradingSignalPrompt',
  input: {schema: ExplainTradingSignalInputSchema},
  output: {schema: ExplainTradingSignalOutputSchema},
  prompt: `You are an expert financial analyst for beginner traders. 
Your task is to provide a highly concise, step-wise explanation for a '{{{signal}}}' signal on **{{{assetSymbol}}}**.

Confidence Level: {{confidenceScore}}%

**Constraints:**
1. Be extremely concise. Use simple language.
2. Break the analysis into exactly 3-5 logical "steps".
3. The 'summary' should be one punchy sentence.
4. The 'conclusion' should focus on risk or the primary reason for the signal.

**Data Context:**
- Patterns: {{#each detectedPatterns}}{{{this}}}, {{/each}}
- Indicators: {{#each technicalIndicators}}{{{name}}} is {{{value}}}, {{/each}}
- Momentum: {{{priceMomentum}}}
{{#if marketContext}}- Context: {{{marketContext}}}{{/if}}

Provide the output in the requested JSON format with 'summary', 'steps' (array), and 'conclusion'.`,
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
