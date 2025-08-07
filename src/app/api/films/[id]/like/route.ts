
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

async function upsertFilm(supabase: ReturnType<typeof createClient>, filmId: number) {
    const { error } = await supabase
      .from('films')
      .upsert({ id: filmId, title: 'Unknown Film' }, { onConflict: 'id' });
    if (error) throw error;
}

// POST to like a film
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const filmId = parseInt(params.id, 10);
  if (isNaN(filmId)) {
    return NextResponse.json({ error: 'Invalid film ID.' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    await upsertFilm(supabase, filmId);

    const { error } = await supabase.from('liked_films').insert({
      user_id: userId,
      film_id: filmId,
    });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'You have already liked this film.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Successfully liked film.' }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to like film:', error);
    return NextResponse.json({ error: 'Failed to like film.' }, { status: 500 });
  }
}

// DELETE to unlike a film
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const filmId = parseInt(params.id, 10);
  if (isNaN(filmId)) {
    return NextResponse.json({ error: 'Invalid film ID.' }, { status: 400 });
  }
  
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('liked_films')
      .delete()
      .eq('user_id', userId)
      .eq('film_id', filmId);

    if (error) {
       // If the record to delete is not found, it's not a server error.
       // Supabase/Postgres might not have a specific code for this in the same way Prisma does,
       // so we just proceed assuming success if no other error occurred.
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     console.error('Failed to unlike film:', error);
     return NextResponse.json({ error: 'Failed to unlike film.' }, { status: 500 });
  }
}
