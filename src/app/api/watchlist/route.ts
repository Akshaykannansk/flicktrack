
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

async function upsertFilm(supabase: ReturnType<typeof createClient>, filmId: number) {
    const { error } = await supabase
      .from('films')
      .upsert({ id: filmId, title: 'Unknown Film' }, { onConflict: 'id' });
    if (error) throw error;
}

// GET all watchlist items for the user
export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const supabase = createClient();
    const { data: watchlistItems, error } = await supabase
      .from('watchlist_items')
      .select('films(*)')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw error;

    const responseData = watchlistItems.map(item => ({
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
    const supabase = createClient();
    
    await upsertFilm(supabase, filmId);

    const { data: newItem, error } = await supabase.from('watchlist_items').insert({
      user_id: userId,
      film_id: filmId,
    }).select().single();

    if (error) {
      if (error.code === '23505') { // unique constraint
        return NextResponse.json({ error: 'Film is already in the watchlist' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add to watchlist:', error);
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
    const supabase = createClient();

    const { error } = await supabase.from('watchlist_items').delete().match({
        user_id: userId,
        film_id: filmId
    });

    if (error) throw error;

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
    console.error('Failed to remove from watchlist:', error);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}
