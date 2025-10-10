
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
  
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse(JSON.stringify({ watchlistIds: [], likedIds: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const [watchlist, likedFilms] = await Promise.all([
        prisma.watchlistItem.findMany({
            where: { userId: user.id },
            select: { filmId: true },
        }),
        prisma.likedFilm.findMany({
            where: { userId: user.id },
            select: { filmId: true },
        }),
    ]);

    const watchlistIds = new Set(watchlist.map(item => item.filmId));
    const likedIds = new Set(likedFilms.map(item => item.filmId));

    return new NextResponse(JSON.stringify({ 
        watchlistIds: Array.from(watchlistIds),
        likedIds: Array.from(likedIds),
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
