import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchFilms } from '@/lib/tmdb-server';
import type { Film } from '@/lib/types';

// Function to get film suggestions from Gemini
async function getFilmSuggestionsFromGemini(plot: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `Based on the following plot summary, suggest up to 5 film titles that match. Return only the titles, separated by newlines. Plot: "${plot}"`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.split('\n').filter(title => title.trim() !== '');
  } catch (error) {
    console.error("Error fetching suggestions from Gemini:", error);
    return [];
  }
}

// Function to search films by plot using Gemini suggestions
async function searchFilmsByPlotWithGemini(plot: string): Promise<Film[]> {
  const suggestions = await getFilmSuggestionsFromGemini(plot);
  if (!suggestions || suggestions.length === 0) {
    return [];
  }

  const searchPromises = suggestions.map(title => searchFilms(title, 1, 1));
  const searchResults = await Promise.all(searchPromises);
  const films = searchResults.flat().filter(film => film !== null) as Film[];

  // Remove duplicates
  const uniqueFilms = films.filter((film, index, self) =>
    index === self.findIndex((f) => (
      f.id === film.id
    ))
  );

  return uniqueFilms;
}


export async function POST(request: Request) {
  try {
    const { plot } = await request.json();

    if (!plot) {
      return NextResponse.json({ error: 'Plot is required' }, { status: 400 });
    }

    const films = await searchFilmsByPlotWithGemini(plot);
    return NextResponse.json({ films });
  } catch (error) {
    console.error('Error in search API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
