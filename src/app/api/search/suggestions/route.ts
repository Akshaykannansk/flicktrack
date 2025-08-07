import { NextResponse } from 'next/server';
import { searchFilms } from '@/lib/tmdb';
import type { PublicUser } from '@/lib/types';
import prisma from '@/lib/prisma';

async function searchUsers(query: string): Promise<PublicUser[]> {
    if (!query) return [];

    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 10,
            select: {
                id: true,
                name: true,
                username: true,
                imageUrl: true,
            }
        });

        return users;
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
