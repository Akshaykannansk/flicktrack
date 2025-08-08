
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

async function upsertFilm(filmId: number) {
    await prisma.film.upsert({
        where: { id: filmId },
        update: {},
        create: { id: filmId, title: 'Unknown Film' },
    });
}

// GET all watchlist items for the user
export async function GET(request: Request) {
  const session = await getSession({ cookies: cookies() });
  const user = session?.user;
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const watchlistItems = await prisma.watchlistItem.findMany({
      where: { userId: user.id },
      include: {
        film: true,
      },
      orderBy: {
        addedAt: 'desc',
      },
    });
    
    return NextResponse.json(watchlistItems.map(item => ({ film: {...item.film, id: item.film.id.toString() } })));
  } catch (error) {
    console.error('Failed to fetch watchlist:', error);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

const watchlistActionSchema = z.object({
  filmId: z.number(),
});

// POST a new film to the watchlist
export async function POST(request: Request) {
  const session = await getSession({ cookies: cookies() });
  const user = session?.user;
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
    
  try {
    const body = await request.json();
    const validation = watchlistActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }
    
    const { filmId } = validation.data;
    
    await upsertFilm(filmId);

    const newItem = await prisma.watchlistItem.create({
      data: {
        userId: user.id,
        filmId: filmId,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // unique constraint
        return NextResponse.json({ error: 'Film is already in the watchlist' }, { status: 409 });
    }
    console.error('Failed to add to watchlist:', error);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

// DELETE a film from the watchlist
export async function DELETE(request: Request) {
  const session = await getSession({ cookies: cookies() });
  const user = session?.user;
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
    
  try {
    const body = await request.json();
    const validation = watchlistActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }
    
    const { filmId } = validation.data;

    await prisma.watchlistItem.delete({
      where: {
        userId_filmId: {
          userId: user.id,
          filmId: filmId,
        },
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
    console.error('Failed to remove from watchlist:', error);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}
