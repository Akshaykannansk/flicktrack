
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getLikedFilms } from '@/services/filmService';

// GET all liked films for the user
export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
    
  try {
    const likedFilms = await getLikedFilms(user.id);
    const responseData = likedFilms.map(lf => ({ film: { ...lf.film, id: lf.film.id.toString() } }));
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch liked films:', error);
    return NextResponse.json({ error: 'Failed to fetch liked films' }, { status: 500 });
  }
}
