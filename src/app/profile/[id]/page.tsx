
import { ProfilePageContent } from '../page';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
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
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
        return null;
    }
    
    const dbUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        bio: (clerkUser.publicMetadata.bio as string) ?? null,
      },
      create: {
        id: userId,
        bio: (clerkUser.publicMetadata.bio as string) ?? null,
        email: clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)!.emailAddress,
        name: clerkUser.fullName,
        username: clerkUser.username,
        imageUrl: clerkUser.imageUrl,
      },
    });

    const stats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            journalEntries: true,
            followers: true,
            following: true,
            likes: true,
            likedLists: true,
          }
        },
        favoriteFilms: {
            include: { film: true },
        },
        journalEntries: {
            take: 10,
            orderBy: { logged_date: 'desc' },
            include: { film: true }
        }
      }
    });

    if (!stats) return null;

    const [watchlist, likes] = await Promise.all([
      prisma.watchlistItem.findMany({ where: { userId }, select: { filmId: true } }),
      prisma.likedFilm.findMany({ where: { userId }, select: { filmId: true } }),
    ]);

    const watchlistIds = new Set(watchlist.map(item => item.filmId));
    const likedIds = new Set(likes.map(item => item.filmId));

    const { userId: currentUserId } = auth();
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
        const follow = await prisma.follows.findUnique({
            where: { followerId_followingId: { followerId: currentUserId, followingId: userId } }
        });
        isFollowing = !!follow;
    }

    return {
        user: {
            ...clerkUser,
            bio: dbUser.bio,
        },
        stats: {
            journalCount: stats._count.journalEntries,
            followersCount: stats._count.followers,
            followingCount: stats._count.following,
            likesCount: stats._count.likes + stats._count.likedLists,
            favoriteFilms: stats.favoriteFilms.map(fav => ({ ...fav.film, id: fav.film.id.toString() })) as FilmType[],
            watchlistIds,
            likedIds,
            recentJournalEntries: stats.journalEntries.map(entry => ({
                id: entry.id,
                film: {
                    ...entry.film,
                    id: entry.film.id.toString(),
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
