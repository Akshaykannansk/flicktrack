import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const favoriteFilmsSchema = z.object({
  filmIds: z.array(z.number()).max(4, 'You can only have up to 4 favorite films.'),
});

// GET user's favorite films
export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favoriteFilms: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.favoriteFilms);
  } catch (error) {
    console.error('Failed to fetch favorite films:', error);
    return NextResponse.json({ error: 'Failed to fetch favorite films' }, { status: 500 });
  }
}

// POST (update) user's favorite films
export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = favoriteFilmsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const { filmIds } = validation.data;
    
    // Ensure films exist in the DB, create if not
    for (const filmId of filmIds) {
        await prisma.film.upsert({
            where: {id: filmId },
            update: {},
            create: {
                id: filmId,
                title: "Unknown Film" // This will be updated later if needed
            }
        })
    }
    
    // Update user's favorite films
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        favoriteFilms: {
          set: filmIds.map(id => ({ id })),
        },
      },
      include: {
        favoriteFilms: true
      }
    });

    return NextResponse.json(updatedUser.favoriteFilms, { status: 200 });
  } catch (error) {
    console.error('Failed to update favorite films:', error);
    return NextResponse.json({ error: 'Failed to update favorite films' }, { status: 500 });
  }
}
