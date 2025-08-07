
import { ProfilePageContent } from '../page';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import type { Film as FilmType } from '@/lib/types';
import { getFilmDetails } from '@/lib/tmdb';


async function getUserData(userId: string) {
    const user = await clerkClient.users.getUser(userId);

    if (!user) {
        return null;
    }
    
    // Check if the user exists in our DB, if not, create them
    const dbUser = await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            email: user.emailAddresses[0].emailAddress,
            name: user.fullName,
            username: user.username,
        },
        include: {
            favoriteFilms: true,
            _count: {
                select: {
                    followers: true,
                    following: true,
                    journalEntries: true,
                    likes: true,
                }
            }
        }
    });

    const journalCount = dbUser._count.journalEntries;
    const followersCount = dbUser._count.followers;
    const followingCount = dbUser._count.following;
    const likesCount = dbUser._count.likes;

    const favoriteFilmsDetails = await Promise.all(
        dbUser.favoriteFilms.map(film => getFilmDetails(film.id.toString()))
    );

    const validFavoriteFilms = favoriteFilmsDetails.filter(Boolean) as FilmType[];
    
    const [watchlist, likes] = await Promise.all([
      prisma.watchlistItem.findMany({
          where: { userId },
          select: { filmId: true }
      }),
      prisma.likedFilm.findMany({
          where: { userId },
          select: { filmId: true }
      })
    ]);

    const watchlistIds = new Set(watchlist.map(item => item.filmId));
    const likedIds = new Set(likes.map(item => item.filmId));

    const recentJournalEntries = await prisma.journalEntry.findMany({
        where: { userId },
        take: 10,
        orderBy: { loggedDate: 'desc' },
        include: { film: true }
    });

    const { userId: currentUserId } = auth();
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
        const follow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: userId
                }
            }
        });
        isFollowing = !!follow;
    }

    return {
        user,
        stats: {
            journalCount,
            followersCount,
            followingCount,
            likesCount,
            favoriteFilms: validFavoriteFilms,
            watchlistIds,
            likedIds,
            recentJournalEntries: recentJournalEntries.map(entry => ({
                id: entry.id,
                film: {
                    id: entry.film.id.toString(),
                    title: entry.film.title,
                    poster_path: entry.film.posterPath,
                    release_date: entry.film.releaseDate ? new Date(entry.film.releaseDate).toISOString() : '',
                    vote_average: entry.film.voteAverage,
                    overview: entry.film.overview,
                },
                rating: entry.rating,
                review: entry.review || undefined,
                loggedDate: entry.loggedDate.toISOString()
            }))
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
