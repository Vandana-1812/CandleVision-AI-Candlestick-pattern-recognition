'use server';
/**
 * @fileOverview A Genkit flow for generating student-friendly explanations of AI-generated trading signals.
 *
 * - explainTradingSignals - A function that generates an explanation for a trading signal.
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
  explanation: z.string().describe('The student-friendly explanation of the trading signal.'),
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
  prompt: `You are an expert financial analyst providing clear, student-friendly explanations of trading signals.
Your goal is to help a beginner understand why a specific trading signal (Buy, Sell, or Hold) was generated for a given asset, based on market analysis.

Provide a detailed but easy-to-understand explanation for the trading signal for **{{{assetSymbol}}}**.

**Trading Signal:** {{{signal}}} (Confidence: {{confidenceScore}}%)

**Key Factors:**

{{#if detectedPatterns.length}}
- **Candlestick Patterns:**
  {{#each detectedPatterns}}
  - The '{{{this}}}' pattern was detected, which typically indicates...
  {{/each}}
{{/if}}

{{#if technicalIndicators.length}}
- **Technical Indicators:**
  {{#each technicalIndicators}}
  - The **{{{name}}}** indicator currently shows a value of {{{value}}}, suggesting...
  {{/each}}
{{/if}}

- **Price Momentum:** The current price momentum is described as: "{{{priceMomentum}}}", indicating...

{{#if marketContext}}
- **Additional Market Context:** "{{{marketContext}}}". This context might influence the signal by...
{{/if}}

Based on these factors, the '{{{signal}}}' signal has been generated because... [Elaborate here, connecting the dots for the student trader. Explain the significance of each factor and how they collectively support the signal. Use simple language and relatable analogies if helpful. Be sure to explain the implication of the identified patterns and indicators for a beginner trader.]`,
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
