
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const updateListSchema = z.object({
  name: z.string().min(1, 'List name is required.').optional(),
  description: z.string().optional(),
});

const filmActionSchema = z.object({
  filmId: z.number(),
});

async function upsertFilm(supabase: ReturnType<typeof createClient>, filmId: number) {
    const { error } = await supabase
      .from('films')
      .upsert({ id: filmId, title: 'Unknown Film' }, { onConflict: 'id' });
    if (error) throw error;
}

// GET a single list with its films
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  try {
    const listId = params.id;
    const { data, error } = await supabase
      .from('film_lists')
      .select(`
        *,
        users ( id, name, username ),
        films_on_lists (
          added_at,
          films ( * )
        ),
        liked_lists ( count )
      `)
      .eq('id', listId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
    // Sort films by added_at date
    const sortedFilms = data.films_on_lists.sort((a, b) => 
        new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
    );

    const responseData = {
        ...data,
        user: data.users,
        films: sortedFilms.map(item => ({
            addedAt: item.added_at,
            film: {
                ...item.films,
                id: item.films.id.toString(),
            }
        })),
        _count: {
            likedBy: data.liked_lists[0]?.count || 0
        }
    }
    // remove original relational fields
    delete (responseData as any).users;
    delete (responseData as any).films_on_lists;
    delete (responseData as any).liked_lists;

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Failed to fetch list ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 });
  }
}

// PUT (update) a list's details
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const supabase = createClient();

  try {
    const listId = params.id;
    const body = await request.json();
    const validation = updateListSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const { data: updatedList, error } = await supabase
      .from('film_lists')
      .update(validation.data)
      .eq('id', listId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error(`Failed to update list ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}

// DELETE a list
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
    const { userId } = auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const supabase = createClient();
    
    try {
        const listId = params.id;
        const { error } = await supabase
            .from('film_lists')
            .delete()
            .eq('id', listId)
            .eq('user_id', userId);

        if (error) throw error;

        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error) {
        console.error(`Failed to delete list ${params.id}:`, error);
        return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
    }
}

// POST a film to a list
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const supabase = createClient();

  try {
    const listId = params.id;
    const body = await request.json();
    const validation = filmActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const { filmId } = validation.data;
    
    await upsertFilm(supabase, filmId);

    const { data: filmOnList, error } = await supabase.from('films_on_lists').insert({
      list_id: listId,
      film_id: filmId,
    }).select().single();

    if (error) {
      if (error.code === '23505') { // unique constraint
         return NextResponse.json({ error: 'Film is already in this list' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(filmOnList, { status: 201 });
  } catch (error: any) {
    console.error(`Failed to add film to list ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to add film to list' }, { status: 500 });
  }
}
