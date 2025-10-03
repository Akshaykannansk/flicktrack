import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

export const moviePlotSearch = ai.defineFlow(
    {
      name: 'moviePlotSearch',
      inputSchema: z.string(),
      outputSchema: z.array(z.string()),
    },
    async (plot) => {
      const llmResponse = await ai.generate({
        prompt: `Based on the following plot summary, suggest up to 5 film titles that match. Return only the titles, separated by newlines. Plot: "${plot}"`,
      });
  
      const suggestions = llmResponse.text();
      return suggestions.split('\n').filter(title => title.trim() !== '');
    }
  );
