import { NextResponse } from 'next/server';
import { ai, moviePlotSearch } from '@/ai/genkit';
import { searchFilms } from '@/lib/tmdb-server';
import type { Film } from '@/lib/types';

async function searchFilmsByPlotWithGenkit(plot: string): Promise<Film[]> {
  const suggestions = await ai.run(moviePlotSearch, plot);

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

    const films = await searchFilmsByPlotWithGenkit(plot);
    return NextResponse.json({ films });
  } catch (error) {
    console.error('Error in search API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
