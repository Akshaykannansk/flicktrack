
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSimilarMovies, getPopularMovies } from '@/lib/tmdb-server';
import { Film } from '@/lib/types';

const prisma = new PrismaClient();

// Helper to pick a random element from an array
function getRandomElement<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}

// Fetches multiple potential seed films for variety
async function getSeedFilmIds(userId: string, key: string, count: number = 5): Promise<number[]> {
    switch (key) {
        case 'rated': {
            const entries = await prisma.journalEntry.findMany({
                where: { userId, rating: { gte: 4 } },
                orderBy: { logged_date: 'desc' },
                take: count,
                select: { filmId: true }
            });
            return entries.map(e => e.filmId);
        }
        case 'liked': {
            const liked = await prisma.likedFilm.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: count,
                select: { filmId: true }
            });
            return liked.map(l => l.filmId);
        }
        case 'watchlist': {
            const items = await prisma.watchlistItem.findMany({
                where: { userId },
                orderBy: { addedAt: 'desc' },
                take: count,
                select: { filmId: true }
            });
            return items.map(i => i.filmId);
        }
        default:
            return [];
    }
}

// Gets films popular with followed users
async function getFollowingRecommendations(userId: string): Promise<Partial<Film>[]> {
    const following = await prisma.follows.findMany({
        where: { followerId: userId },
        select: { followingId: true }
    });

    if (following.length === 0) {
        return [];
    }

    const followedUserIds = following.map(f => f.followingId);

    // Get recently liked films from followed users
    const likedFilms = await prisma.likedFilm.findMany({
        where: {
            userId: { in: followedUserIds },
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 20,
        select: {
            film: {
                select: {
                    id: true,
                    title: true,
                    poster_path: true,
                    release_date: true,
                }
            }
        }
    });

    // Get films from recently-written high-rated reviews from followed users
    const reviewedFilms = await prisma.journalEntry.findMany({
        where: {
            userId: { in: followedUserIds },
            rating: { gte: 4 },
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 20,
        select: {
            film: {
                select: {
                    id: true,
                    title: true,
                    poster_path: true,
                    release_date: true,
                }
            }
        }
    });

    const userFilms = await prisma.journalEntry.findMany({
        where: { userId },
        select: { filmId: true }
    });
    const userFilmIds = new Set(userFilms.map(f => f.filmId));

    const combined = [...likedFilms.map(f => f.film), ...reviewedFilms.map(f => f.film)];

    // Deduplicate and filter out films the user has already logged
    const uniqueRecs = Array.from(new Map(combined.map(film => [film.id, film])).values());
    const filteredRecs = uniqueRecs.filter(film => !userFilmIds.has(film.id));

    // Sort by a proxy for popularity (how many times it appears in the combined list)
    const filmCounts = combined.reduce((acc, film) => {
        acc[film.id] = (acc[film.id] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    filteredRecs.sort((a, b) => (filmCounts[b.id] || 0) - (filmCounts[a.id] || 0));

    return filteredRecs.slice(0, 10);
}


export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!user) {
        // For logged-out users, we can just return trending films
        if (key === 'trending') {
            const trending = await getPopularMovies();
            return NextResponse.json(trending);
        }
        return NextResponse.json([], { status: 401 });
    }

    if (!key) {
        return NextResponse.json({ error: 'Missing recommendation section key' }, { status: 400 });
    }

    try {
        if (key === 'following') {
            const recommendations = await getFollowingRecommendations(user.id);
            return NextResponse.json(recommendations);
        }

        if (key === 'trending') {
            const recommendations = await getPopularMovies();
            return NextResponse.json(recommendations);
        }

        const seedFilmIds = await getSeedFilmIds(user.id, key);

        if (seedFilmIds.length > 0) {
            // Try up to 2 random seeds to find recommendations
            for (let i = 0; i < 2; i++) {
                const randomSeedId = getRandomElement(seedFilmIds);
                if (randomSeedId) {
                    const recommendations = await getSimilarMovies(randomSeedId);
                    if (recommendations && recommendations.length > 0) {
                        return NextResponse.json(recommendations);
                    }
                }
            }
        }
        
        return NextResponse.json([]);

    } catch (error) {
        console.error(`Error fetching recommendations for ${key}:`, error);
        return NextResponse.json([]);
    }
}
