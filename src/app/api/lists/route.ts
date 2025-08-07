

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

const listSchema = z.object({
  name: z.string().min(1, 'List name is required.'),
  description: z.string().optional(),
});


// GET all lists for the user
export async function GET() {
  const { userId } = auth();
  if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
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

// POST (create) a new list
export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = listSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const { name, description } = validation.data;
    const newList = await prisma.filmList.create({
      data: {
        name,
        description,
        userId,
      },
    });

    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    console.error('Failed to create list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
