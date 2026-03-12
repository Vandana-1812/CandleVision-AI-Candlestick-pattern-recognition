'use server';
/**
 * @fileOverview A Genkit flow for personalizing learning paths based on user progress, weaknesses, and learning style.
 *
 * - personalizeLearningPaths - A function that handles the learning path personalization process.
 * - PersonalizeLearningPathsInput - The input type for the personalizeLearningPaths function.
 * - PersonalizeLearningPathsOutput - The return type for the personalizeLearningPaths function.
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

export async function personalizeLearningPaths(
  input: PersonalizeLearningPathsInput
): Promise<PersonalizeLearningPathsOutput> {
  return personalizeLearningPathsFlow(input);
}

const personalizeLearningPathsPrompt = ai.definePrompt({
  name: 'personalizeLearningPathsPrompt',
  input: {schema: PersonalizeLearningPathsInputSchema},
  output: {schema: PersonalizeLearningPathsOutputSchema},
  prompt: `You are an AI-powered tutor for the CandleVision trading education platform. Your goal is to create a personalized learning path for a user based on their progress, identified weaknesses, and preferred learning style, helping them efficiently improve their trading knowledge and skills.

The CandleVision platform offers interactive modules on complex trading concepts, candlestick patterns, and indicators.

Here is the user's current information:

User Progress: {{{userProgress}}}
Identified Weaknesses:
{{#each identifiedWeaknesses}}- {{{this}}}
{{/each}}
Learning Style: {{{learningStyle}}}

Based on this information, generate a personalized learning path tailored to the user's needs. The learning path should consist of a sequence of modules or topics. Also, provide a clear rationale for your recommendations, explaining how it addresses their weaknesses and aligns with their learning style.

The output should be a JSON object with two fields: 'learningPath' (an array of objects with 'module' and 'description' fields) and 'rationale' (a string).`,
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
