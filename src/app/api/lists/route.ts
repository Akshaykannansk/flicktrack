import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

// GET all lists for the user
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const lists = await prisma.filmList.findMany({
      where: { userId: userId },
      include: {
        _count: {
          select: { films: true },
        },
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
