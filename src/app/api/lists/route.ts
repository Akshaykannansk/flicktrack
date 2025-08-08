
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const listSchema = z.object({
  name: z.string().min(1, 'List name is required.'),
  description: z.string().optional(),
});


// GET all lists for the user
export async function GET(request: Request) {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const lists = await prisma.filmList.findMany({
      where: { userId: user.id },
      include: {
        films: {
          take: 4,
          orderBy: {
            addedAt: 'desc',
          },
          include: {
            film: {
              select: { id: true, poster_path: true },
            },
          },
        },
        _count: {
          select: { films: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    const responseData = lists.map(list => ({
        ...list,
        id: list.id,
        films: list.films.map(f => ({
            film: {
                id: f.film.id.toString(),
                poster_path: f.film.poster_path
            }
        }))
    }))

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch lists:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

// POST (create) a new list
export async function POST(request: Request) {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
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
        userId: user.id,
      },
    });

    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    console.error('Failed to create list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
