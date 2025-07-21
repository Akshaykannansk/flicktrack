import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// For this prototype, we'll use a hardcoded user ID.
const USER_ID = 'user_2jvcJkLgQf9Qz3gYtH8rXz9Ew1B';

// GET all lists for the user
export async function GET() {
  try {
    const lists = await prisma.filmList.findMany({
      where: { userId: USER_ID },
      include: {
        _count: {
          select: { films: true },
        },
        // Include a few film posters for the preview
        films: {
          take: 4,
          include: {
            film: {
              select: {
                id: true,
                posterPath: true,
              }
            }
          },
          orderBy: {
            addedAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform data to match frontend expectation (string IDs)
    const responseData = lists.map(list => ({
        ...list,
        films: list.films.map(f => ({
            ...f,
            film: {
                ...f.film,
                id: f.film.id.toString(),
                poster_path: f.film.posterPath
            }
        }))
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch lists:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}
