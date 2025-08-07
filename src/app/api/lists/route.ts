
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

const listSchema = z.object({
  name: z.string().min(1, 'List name is required.'),
  description: z.string().optional(),
});


// GET all lists for the user
export async function GET() {
  const { userId } = auth();
  if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
  }
  const supabase = createClient();

  try {
    const { data: lists, error } = await supabase
      .from('film_lists_with_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    const responseData = lists.map(list => ({
      id: list.id,
      name: list.name,
      description: list.description,
      _count: { films: list.film_count || 0 },
      films: list.films ? list.films.slice(0, 4).map((film: any) => ({
        film: {
          id: film.id.toString(),
          poster_path: film.poster_path
        }
      })) : []
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch lists:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

// POST (create) a new list
export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createClient();

  try {
    const body = await request.json();
    const validation = listSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const { name, description } = validation.data;
    
    const { data: newList, error } = await supabase
      .from('film_lists')
      .insert({
        name,
        description,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    console.error('Failed to create list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
