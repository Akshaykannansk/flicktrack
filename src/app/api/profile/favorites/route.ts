
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { getFilmDetails } from '@/lib/tmdb';

const favoriteFilmsSchema = z.object({
  filmIds: z.array(z.number()).max(4, 'You can only have up to 4 favorite films.'),
});

// GET user's favorite films
export async function GET(request: Request) {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const favoriteFilms = await prisma.favoriteFilm.findMany({
      where: { userId: user.id },
      include: { film: true },
    });

    return NextResponse.json(favoriteFilms.map(fav => fav.film));
  } catch (error) {
    console.error('Failed to fetch favorite films:', error);
    return NextResponse.json({ error: 'Failed to fetch favorite films' }, { status: 500 });
  }
}

// POST (update) user's favorite films
export async function POST(request: Request) {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = favoriteFilmsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const { filmIds } = validation.data;
    
    // Fetch film details from TMDB and upsert them into our database
    for (const filmId of filmIds) {
        const filmDetails = await getFilmDetails(filmId.toString());
        if (filmDetails) {
            await prisma.film.upsert({
                where: { id: filmId },
                update: {
                    title: filmDetails.title,
                    overview: filmDetails.overview,
                    poster_path: filmDetails.poster_path,
                    release_date: filmDetails.release_date ? new Date(filmDetails.release_date) : null,
                    vote_average: filmDetails.vote_average,
                },
                create: {
                    id: filmId,
                    title: filmDetails.title,
                    overview: filmDetails.overview,
                    poster_path: filmDetails.poster_path,
                    release_date: filmDetails.release_date ? new Date(filmDetails.release_date) : null,
                    vote_average: filmDetails.vote_average,
                }
            });
        }
    }
    
    await prisma.$transaction(async (tx) => {
        // Delete all existing favorites for the user
        await tx.favoriteFilm.deleteMany({
            where: { userId: user.id },
        });

        // Add the new favorites
        if (filmIds.length > 0) {
            await tx.favoriteFilm.createMany({
                data: filmIds.map(id => ({ userId: user!.id, filmId: id })),
            });
        }
    });


    const favorite_films = await prisma.favoriteFilm.findMany({
      where: { userId: user.id },
      include: { film: true },
    });

    return NextResponse.json(favorite_films.map(fav => fav.film), { status: 200 });
  } catch (error) {
    console.error('Failed to update favorite films:', error);
    return NextResponse.json({ error: 'Failed to update favorite films' }, { status: 500 });
  }
}
