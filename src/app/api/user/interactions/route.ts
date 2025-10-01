import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import type { CookieOptions } from '@supabase/ssr';

export async function GET() {
    const cookieStore = cookies();
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
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ watchlistIds: [], likedIds: [] });
    }

    try {
        const [watchlist, likedFilms] = await Promise.all([
            prisma.watchlistItem.findMany({
                where: { userId: user.id },
                select: { filmId: true },
            }),
            prisma.likedFilm.findMany({
                where: { userId: user.id },
                select: { filmId: true },
            })
        ]);

        const watchlistIds = watchlist.map(item => item.filmId);
        const likedIds = likedFilms.map(item => item.filmId);

        return NextResponse.json({ watchlistIds, likedIds });
    } catch (error) {
        console.error('Error fetching user interactions:', error);
        return new NextResponse(
            JSON.stringify({ error: 'Failed to fetch user interactions' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
