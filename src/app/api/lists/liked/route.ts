
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// GET all liked lists for the user with details
export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const supabase = createClient();
    
    const { data: likedListRelations, error: likedListError } = await supabase
      .from('liked_lists')
      .select('list_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (likedListError) throw likedListError;

    const listIds = likedListRelations.map(item => item.list_id);

    if (listIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: lists, error: listsError } = await supabase
      .from('film_lists_with_details')
      .select('*')
      .in('id', listIds);
    
    if (listsError) throw listsError;

    // We need to preserve the original like order
    const orderedLists = listIds.map(id => lists.find(list => list.id === id)).filter(Boolean);
    
    const responseData = orderedLists.map(list => ({
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
    console.error('Failed to fetch liked lists:', error);
    return NextResponse.json({ error: 'Failed to fetch liked lists' }, { status: 500 });
  }
}
