'use server';

import { generateFilmRecommendations, type GenerateFilmRecommendationsInput, type GenerateFilmRecommendationsOutput } from '@/ai/flows/generate-film-recommendations';

export async function getRecommendations(input: GenerateFilmRecommendationsInput): Promise<GenerateFilmRecommendationsOutput> {
  try {
    const output = await generateFilmRecommendations(input);
    return output;
  } catch (error) {
    console.error('Error generating film recommendations:', error);
    // In a real app, you'd handle this more gracefully, perhaps returning a custom error object.
    throw new Error('Failed to generate recommendations.');
  }
}
