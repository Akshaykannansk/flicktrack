
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getFollowingFeedForUser } from '@/services/userService';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { 
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          await cookieStore.set({ name, value, ...options })
        },
        async remove(name: string, options: CookieOptions) {
          await cookieStore.set({ name, value: '', ...options })
        },
      } 
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    const feedEntries = await getFollowingFeedForUser(user.id);
    return NextResponse.json(feedEntries);
  } catch (error) {
    console.error('Failed to fetch activity feed:', error);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
  }
}
