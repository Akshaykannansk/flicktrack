
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET all liked films for the user
export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const likedFilms = await prisma.likedFilm.findMany({
      where: { userId: userId },
      include: {
        film: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const responseData = likedFilms.map(item => ({
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
    console.error('Failed to fetch liked films:', error);
    return NextResponse.json({ error: 'Failed to fetch liked films' }, { status: 500 });
  }
}
