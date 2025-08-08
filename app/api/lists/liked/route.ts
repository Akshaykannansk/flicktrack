
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getLikedListsWithDetails } from '@/services/listService';

// GET all liked lists for the user with details
export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
    
  try {
    const likedLists = await getLikedListsWithDetails(user.id);

    const responseData = likedLists.map(item => ({
      ...item.list,
      id: item.list.id.toString(),
      films: item.list.films.map(f => ({ film: { ...f.film, id: f.film.id.toString() }})),
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch liked lists:', error);
    return NextResponse.json({ error: 'Failed to fetch liked lists' }, { status: 500 });
  }
}
