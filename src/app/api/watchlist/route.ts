import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

// GET all watchlist items for the user
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const watchlistItems = await prisma.watchlistItem.findMany({
      where: { userId: userId },
      include: {
        film: true,
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    const responseData = watchlistItems.map(item => ({
      film: {
        id: item.film.id.toString(),
        title: item.film.title,
        poster_path: item.film.posterPath,
        release_date: item.film.releaseDate,
        vote_average: item.film.voteAverage,
        overview: item.film.overview,
      }
    }));
    
    return NextResponse.json(responseData);
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
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const body = await request.json();
    const validation = watchlistActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }
    
    const { filmId } = validation.data;
    
    await prisma.film.upsert({
      where: { id: filmId },
      update: {},
      create: {
        id: filmId,
        title: 'Unknown Film', // You might want to fetch this from TMDB
      },
    });


    const newItem = await prisma.watchlistItem.create({
      data: {
        userId: userId,
        filmId,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add to watchlist:', error);
    if (error.code === 'P2002') { // Unique constraint failed
        return NextResponse.json({ error: 'Film is already in the watchlist' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

// DELETE a film from the watchlist
export async function DELETE(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const body = await request.json();
    const validation = watchlistActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }
    
    const { filmId } = validation.data;

    await prisma.watchlistItem.delete({
      where: {
        userId_filmId: {
          userId: userId,
          filmId,
        },
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
    console.error('Failed to remove from watchlist:', error);
     if (error.code === 'P2025') { // Record to delete not found
      return new NextResponse(null, { status: 204 }); // Already deleted, success.
    }
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}
