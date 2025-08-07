
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// GET all liked films for the user
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
