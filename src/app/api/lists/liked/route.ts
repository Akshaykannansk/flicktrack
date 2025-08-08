
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET all liked lists for the user with details
export async function GET(request: Request) {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
    
  try {
    const likedLists = await prisma.likedList.findMany({
      where: { userId: user.id },
      include: {
        list: {
          include: {
            films: {
              take: 4,
              include: {
                film: {
                  select: { id: true, poster_path: true }
                }
              }
            },
            _count: {
              select: { films: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const responseData = likedLists.map(item => ({
      ...item.list,
      id: item.list.id.toString(),
      films: item.list.films.map(f => ({ film: { ...f.film, id: f.film.id.toString() }})),
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch liked lists:', error);
    return NextResponse.json({ error: 'Failed to fetch liked lists' }, { status: 500 });
  }
}
