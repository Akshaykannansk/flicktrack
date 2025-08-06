import { NextResponse } from 'next/server';
import { searchFilms } from '@/lib/tmdb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const films = await searchFilms(query);
    // Limit to 5 suggestions for a cleaner UI
    const suggestions = films.slice(0, 5);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Failed to fetch search suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch search suggestions' }, { status: 500 });
  }
}
