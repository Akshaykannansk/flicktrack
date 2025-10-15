
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getTrendingReviews } from '@/services/reviewService';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { 
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      } 
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  try {
    const trendingReviews = await getTrendingReviews(user?.id);
    return NextResponse.json(trendingReviews);
  } catch (error) {
    console.error('Failed to fetch trending reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch trending reviews' }, { status: 500 });
  }
}
