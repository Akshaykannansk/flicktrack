
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET all liked lists for the user with details
export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const likedListRelations = await prisma.likedList.findMany({
      where: { userId: userId },
      select: {
        listId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const listIds = likedListRelations.map(item => item.listId);

    const lists = await prisma.filmList.findMany({
      where: { 
        id: {
            in: listIds
        } 
      },
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
    });

    // We need to preserve the original like order
    const orderedLists = listIds.map(id => lists.find(list => list.id === id)).filter(Boolean);
    
    const responseData = orderedLists.map(list => ({
        ...list,
        films: list!.films.map(f => ({
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
    console.error('Failed to fetch liked lists:', error);
    return NextResponse.json({ error: 'Failed to fetch liked lists' }, { status: 500 });
  }
}
