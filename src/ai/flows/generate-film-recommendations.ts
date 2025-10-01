// This is a server-side file.
'use server';

/**
 * @fileOverview Generates personalized film recommendations based on user viewing history and ratings.
 *
 * - generateFilmRecommendations - A function to generate film recommendations.
 * - GenerateFilmRecommendationsInput - The input type for the generateFilmRecommendations function.
 * - GenerateFilmRecommendationsOutput - The output type for the generateFilmRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFilmRecommendationsInputSchema = z.object({
  viewingHistory: z
    .array(
      z.object({
        filmTitle: z.string().describe('The title of the film.'),
        rating: z
          .number()
          .min(0.5)
          .max(5)
          .describe('The user rating of the film (0.5 to 5 stars).'),
      })
    )
    .describe('The user viewing history with film titles and ratings.'),
    existingRecommendations: z.array(z.string()).optional().describe('A list of film titles that have already been recommended.'),
});
export type GenerateFilmRecommendationsInput = z.infer<
  typeof GenerateFilmRecommendationsInputSchema
>;

const GenerateFilmRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        filmTitle: z.string().describe('The title of the recommended film.'),
        releaseYear: z.number().describe('The release year of the recommended film.'),
        reason: z.string().describe('The reason for recommending this film.'),
      })
    )
    .describe('A list of recommended films with reasons.'),
});
export type GenerateFilmRecommendationsOutput = z.infer<
  typeof GenerateFilmRecommendationsOutputSchema
>;

export async function generateFilmRecommendations(
  input: GenerateFilmRecommendationsInput
): Promise<GenerateFilmRecommendationsOutput> {
  return generateFilmRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFilmRecommendationsPrompt',
  input: {schema: GenerateFilmRecommendationsInputSchema},
  output: {schema: GenerateFilmRecommendationsOutputSchema},
  prompt: `You are a film recommendation expert. Based on the user's viewing history and ratings, suggest 10 films they might enjoy.

  For each film, provide the title, the release year, and a reason for the recommendation.

  Viewing History:
  {{#each viewingHistory}}
  - Film: {{filmTitle}}, Rating: {{rating}} stars
  {{/each}}
  
  {{#if existingRecommendations}}
  Do not suggest any of the following films:
  {{#each existingRecommendations}}
  - {{this}}
  {{/each}}
  {{/if}}
  `,
});

const generateFilmRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateFilmRecommendationsFlow',
    inputSchema: GenerateFilmRecommendationsInputSchema,
    outputSchema: GenerateFilmRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
