'use server';
/**
 * @fileOverview A Genkit flow for personalizing learning paths based on user progress, weaknesses, and learning style.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizeLearningPathsInputSchema = z.object({
  userProgress: z
    .string()
    .describe("A summary of the user's current learning progress and quiz scores."),
  identifiedWeaknesses: z
    .array(z.string())
    .describe("A list of specific areas or concepts where the user has demonstrated weaknesses."),
  learningStyle: z
    .string()
    .describe("A description of the user's preferred learning style (e.g., visual, auditory, kinesthetic, text-based, interactive)."),
});
export type PersonalizeLearningPathsInput = z.infer<
  typeof PersonalizeLearningPathsInputSchema
>;

const PersonalizeLearningPathsOutputSchema = z.object({
  learningPath: z
    .array(
      z.object({
        module: z
          .string()
          .describe('The name or title of the recommended learning module or topic.'),
        description: z
          .string()
          .describe('A brief description of what the module covers.'),
      })
    )
    .describe('A personalized sequence of learning modules or topics.'),
  rationale: z
    .string()
    .describe(
      "An explanation of why this specific learning path was recommended based on the user's input."
    ),
});
export type PersonalizeLearningPathsOutput = z.infer<
  typeof PersonalizeLearningPathsOutputSchema
>;

const personalizeLearningPathsPrompt = ai.definePrompt({
  name: 'personalizeLearningPathsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: PersonalizeLearningPathsInputSchema},
  output: {schema: PersonalizeLearningPathsOutputSchema},
  config: {
    responseMimeType: 'application/json',
  },
  prompt: `You are an AI-powered tutor for the CandleVision trading education platform. Your goal is to create a personalized learning path for a user based on their progress, identified weaknesses, and preferred learning style.

User Progress: {{{userProgress}}}
Identified Weaknesses:
{{#each identifiedWeaknesses}}- {{{this}}}
{{/each}}
Learning Style: {{{learningStyle}}}

Return a sequence of modules and a rationale.`,
});

const personalizeLearningPathsFlow = ai.defineFlow(
  {
    name: 'personalizeLearningPathsFlow',
    inputSchema: PersonalizeLearningPathsInputSchema,
    outputSchema: PersonalizeLearningPathsOutputSchema,
  },
  async input => {
    const {output} = await personalizeLearningPathsPrompt(input);
    return output!;
  }
);

export async function personalizeLearningPaths(
  input: PersonalizeLearningPathsInput
): Promise<PersonalizeLearningPathsOutput> {
  return personalizeLearningPathsFlow(input);
}
