import { NextResponse } from 'next/server';
import { searchFilms } from '@/lib/tmdb';
import { clerkClient } from '@clerk/nextjs/server';
import type { PublicUser } from '@/lib/types';

async function searchUsers(query: string): Promise<PublicUser[]> {
    if (!query) return [];

    try {
        const clerkUsers = await clerkClient.users.getUserList({ query, limit: 10 });

        return clerkUsers.map(user => ({
            id: user.id,
            name: user.fullName,
            username: user.username,
            imageUrl: user.imageUrl,
        }));
    } catch (error) {
        console.error('Failed to search users:', error);
        return [];
    }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const [films, users] = await Promise.all([
      searchFilms(query),
      searchUsers(query),
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
