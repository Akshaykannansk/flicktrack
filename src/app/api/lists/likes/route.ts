
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getLikedListsIds } from '@/services/listService';

// GET all liked list IDs for the user
export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
    
  try {
    const likedLists = await getLikedListsIds(user.id);
    return NextResponse.json(likedLists);
  } catch (error) {
    console.error('Failed to fetch liked lists:', error);
    return NextResponse.json({ error: 'Failed to fetch liked lists' }, { status: 500 });
  }
}
