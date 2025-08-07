
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getFilmDetails } from '@/lib/tmdb';

const favoriteFilmsSchema = z.object({
  filmIds: z.array(z.number()).max(4, 'You can only have up to 4 favorite films.'),
});

// GET user's favorite films
export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const supabase = createClient();

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        favorite_films: favorite_films(
          film_id,
          films(*)
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.favorite_films.map(fav => fav.films));
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
  const supabase = createClient();

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
            const { error } = await supabase.from('films').upsert({
                id: filmId,
                title: filmDetails.title,
                overview: filmDetails.overview,
                poster_path: filmDetails.poster_path,
                release_date: filmDetails.release_date ? new Date(filmDetails.release_date) : null,
                vote_average: filmDetails.vote_average,
            });
            if (error) console.error("Error upserting film:", error);
        }
    }
    
    // Update user's favorite films (delete all, then re-add)
    const { error: deleteError } = await supabase
      .from('favorite_films')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    if (filmIds.length > 0) {
        const { error: insertError } = await supabase
            .from('favorite_films')
            .insert(filmIds.map(id => ({ user_id: userId, film_id: id })));
        if (insertError) throw insertError;
    }

    const { data: favorite_films, error: finalFetchError } = await supabase
      .from('favorite_films')
      .select('films(*)')
      .eq('user_id', userId);

    if (finalFetchError) throw finalFetchError;

    return NextResponse.json(favorite_films.map(fav => fav.films), { status: 200 });
  } catch (error) {
    console.error('Failed to update favorite films:', error);
    return NextResponse.json({ error: 'Failed to update favorite films' }, { status: 500 });
  }
}
