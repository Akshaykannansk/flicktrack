import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

export const moviePlotSearch = ai.defineFlow(
  {
    name: 'moviePlotSearch',
    inputSchema: z.string(),
    outputSchema: z.array(z.string()),
  },
  async (plot) => {
    const llmResponse = await ai.generate({
      prompt: `Based on the following plot summary, suggest up to 5 film titles that match.
      Return ONLY the movie titles, one per line, no numbers, no bullets, no commentary.
      Plot: "${plot}"`,
    });
    console.log('LLM response:', JSON.stringify(llmResponse, null, 2));
    const raw = llmResponse.message?.content?.[0]?.text ?? '';

    const titles = raw
      .split('\n')
      .map(t => t.replace(/^\d+[\).\s-]*/, '').trim())
      .filter(Boolean)
      .slice(0, 5);
    console.log("titlesssssssssss", titles)
    return titles;
  }
);
