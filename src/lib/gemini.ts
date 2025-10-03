
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

export async function getFilmSuggestionsFromGemini(plot: string): Promise<string[] | null> {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not defined.');
    return null;
  }

  const prompt = `Based on the following plot, suggest a few movie titles that match. Return only the titles, separated by a new line. Plot: ${plot}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt,
          }],
        }],
      }),
    });

    if (!response.ok) {
      console.error('Failed to fetch from Gemini API:', await response.text());
      return null;
    }

    const data = await response.json();
    const suggestionsText = data.candidates[0].content.parts[0].text;
    return suggestionsText.split('\n').filter(title => title.trim() !== '');
  } catch (error) {
    console.error('Error fetching film suggestions from Gemini:', error);
    return null;
  }
}
