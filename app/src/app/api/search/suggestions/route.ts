import { NextResponse } from 'next/server';
import { searchFilms, searchUsers } from '@/lib/tmdb';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const [films, users] = await Promise.all([
      searchFilms(query),
      searchUsers(query, clerkClient),
    ]);
    
    // Limit to 5 suggestions for each for a cleaner UI
    const suggestions = {
        films: films.slice(0, 5),
        users: users.slice(0, 5)
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Failed to fetch search suggestions:', error);
    return NextResponse.json({ films: [], users: [] });
  }
}
