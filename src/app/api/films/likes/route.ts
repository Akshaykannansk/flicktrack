
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// GET all liked films for the user
export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const supabase = createClient();
    const { data: likedFilms, error } = await supabase
      .from('liked_films')
      .select('films(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const responseData = likedFilms.map(item => ({
      film: {
        id: item.films.id.toString(),
        title: item.films.title,
        poster_path: item.films.poster_path,
        release_date: item.films.release_date,
        vote_average: item.films.vote_average,
        overview: item.films.overview,
      }
    }));
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch liked films:', error);
    return NextResponse.json({ error: 'Failed to fetch liked films' }, { status: 500 });
  }
}
