
import { NextResponse } from 'next/server';
import { searchFilms } from '@/lib/tmdb';
import { searchUsers } from '@/services/userService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const films = await searchFilms(query, 1, 5); // Fetch only 5 films for suggestions
    
    const suggestions = {
        films: films,
        users: [] // Return empty array for users
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Failed to fetch search suggestions:', error);
    return NextResponse.json({ films: [], users: [] });
  }
}

