
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { generateFilmRecommendations } from '@/ai/flows/generate-film-recommendations';
import type { Film } from '@/lib/types';

async function getRecommendationsForCategory(filmTitles: string[], count: number = 5): Promise<Film[]> {
    if (filmTitles.length === 0) return [];
    const recommendations = await generateFilmRecommendations(filmTitles.join(', '));
    // In a real application, you would fetch film details from a database or API
    // For this example, we'll create mock film objects
    return recommendations.slice(0, count).map((title, index) => ({
        id: index,
        title: title,
        poster_path: '', // Add a placeholder poster path
    }));
}

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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 1. Get user's liked films
    const likedFilms = await prisma.likedFilm.findMany({
        where: { userId: user.id },
        include: { film: true }
    });

    // 2. Get user's watchlist
    const watchlist = await prisma.watchlistItem.findMany({
        where: { userId: user.id },
        include: { film: true }
    });

    // 3. Get user's high-rated films (rating >= 3.5)
    const highRatedFilms = await prisma.journalEntry.findMany({
        where: {
            userId: user.id,
            rating: { gte: 3.5 }
        },
        include: { film: true }
    });

    // 4. Get films liked and highly-rated by users the current user follows
    const following = await prisma.follows.findMany({
        where: { followerId: user.id },
        select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);

    const followingLikedFilms = await prisma.likedFilm.findMany({
        where: { userId: { in: followingIds } },
        include: { film: true }
    });

    const followingHighRatedFilms = await prisma.journalEntry.findMany({
        where: {
            userId: { in: followingIds },
            rating: { gte: 3.5 }
        },
        include: { film: true }
    });

    const recommendations = {
        liked: await getRecommendationsForCategory(likedFilms.map(f => f.film.title)),
        watchlist: await getRecommendationsForCategory(watchlist.map(f => f.film.title)),
        rated: await getRecommendationsForCategory(highRatedFilms.map(f => f.film.title)),
        following: await getRecommendationsForCategory([...followingLikedFilms.map(f => f.film.title), ...followingHighRatedFilms.map(f => f.film.title)])
    };

    return NextResponse.json(recommendations);
}
