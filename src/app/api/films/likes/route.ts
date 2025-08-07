
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET all liked films for the user
export async function GET(request: Request) {
  const session = await getSession({ cookies: cookies() });
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
    
  try {
    const likedFilms = await prisma.likedFilm.findMany({
      where: { userId: user.id },
      include: {
        film: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(likedFilms.map(lf => ({ film: { ...lf.film, id: lf.film.id.toString() } })));
  } catch (error) {
    console.error('Failed to fetch liked films:', error);
    return NextResponse.json({ error: 'Failed to fetch liked films' }, { status: 500 });
  }
}
