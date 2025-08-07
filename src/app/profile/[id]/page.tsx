
import { ProfilePageContent } from '../page';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import type { Film as FilmType } from '@/lib/types';
import { getFilmDetails as getFilmDetailsFromTMDB } from '@/lib/tmdb';
import type { FilmDetails } from '@/lib/types';
import redis from '@/lib/redis';

const CACHE_EXPIRATION_SECONDS = 60 * 60 * 24; // 24 hours

async function getFilmDetails(id: string): Promise<FilmDetails | null> {
    const cacheKey = `film:${id}`;

    try {
      if (!redis.isOpen) {
        await redis.connect().catch(err => {
            console.error('Failed to connect to Redis for getFilmDetails:', err);
        });
      }

      if (redis.isOpen) {
        const cachedFilm = await redis.get(cacheKey);
        if (cachedFilm) {
            console.log(`CACHE HIT for film: ${id}`);
            return JSON.parse(cachedFilm);
        }
      }
    } catch (error) {
        console.error("Redis GET error in getFilmDetails:", error);
    }

    console.log(`CACHE MISS for film: ${id}. Fetching from TMDB.`);
    const filmDetails = await getFilmDetailsFromTMDB(id);
    
    if (!filmDetails) {
        return null;
    }

    try {
        if (redis.isOpen) {
            await redis.set(cacheKey, JSON.stringify(filmDetails), {
                EX: CACHE_EXPIRATION_SECONDS
            });
        }
    } catch (error) {
        console.error("Redis SET error in getFilmDetails:", error);
    }
    
    return filmDetails;
}


async function getUserData(userId: string) {
    const supabase = createClient();
    const clerkUser = await clerkClient.users.getUser(userId);

    if (!clerkUser) {
        return null;
    }
    
    const { data: dbUser, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        bio: (clerkUser.publicMetadata.bio as string) ?? null,
        email: clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress,
        name: clerkUser.fullName,
        username: clerkUser.username,
        image_url: clerkUser.imageUrl
      }, { onConflict: 'id' })
      .select(`
        *,
        followers:follows!following_id(count),
        following:follows!follower_id(count),
        journal_entries(count),
        liked_films(count),
        liked_lists(count),
        favorite_films:favorite_films(films(*))
      `)
      .single();

    if (error || !dbUser) {
        console.error("Error fetching user data from Supabase:", error);
        return null;
    }

    const journalCount = dbUser.journal_entries[0]?.count || 0;
    const followersCount = dbUser.followers[0]?.count || 0;
    const followingCount = dbUser.following[0]?.count || 0;
    const likesCount = (dbUser.liked_films[0]?.count || 0) + (dbUser.liked_lists[0]?.count || 0);

    const favoriteFilms = dbUser.favorite_films.map(fav => fav.films) as FilmType[];

    const [watchlistRes, likesRes, recentJournalRes] = await Promise.all([
      supabase.from('watchlist_items').select('film_id').eq('user_id', userId),
      supabase.from('liked_films').select('film_id').eq('user_id', userId),
      supabase.from('journal_entries').select('*, films(*)').eq('user_id', userId).order('logged_date', { ascending: false }).limit(10)
    ]);
    
    const watchlistIds = new Set(watchlistRes.data?.map(item => item.film_id));
    const likedIds = new Set(likesRes.data?.map(item => item.film_id));

    const { userId: currentUserId } = auth();
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
        const { data: follow, error: followError } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUserId)
            .eq('following_id', userId)
            .maybeSingle();
        isFollowing = !!follow;
    }

    return {
        user: {
            ...clerkUser,
            bio: dbUser.bio,
        },
        stats: {
            journalCount,
            followersCount,
            followingCount,
            likesCount,
            favoriteFilms,
            watchlistIds,
            likedIds,
            recentJournalEntries: recentJournalRes.data?.map(entry => ({
                id: entry.id,
                film: {
                    ...entry.films,
                    id: entry.films.id.toString(),
                    poster_path: entry.films.poster_path,
                },
                rating: entry.rating,
                review: entry.review || undefined,
                loggedDate: entry.logged_date
            })) || []
        },
        isFollowing,
        isCurrentUser: currentUserId === userId
    }
}


export default async function OtherUserProfilePage({ params }: { params: { id: string } }) {
    const { userId: currentUserId } = auth();
    if (!currentUserId) {
        redirect("/sign-in");
    }

    if (currentUserId === params.id) {
        redirect("/profile");
    }

    const userData = await getUserData(params.id);

    if (!userData) {
        notFound();
    }

    return <ProfilePageContent 
                user={userData.user} 
                stats={userData.stats} 
                isCurrentUser={userData.isCurrentUser}
                isFollowing={userData.isFollowing}
            />;
}
