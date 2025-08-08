
import { ProfilePageContent } from '@/app/profile/page';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import type { Film as FilmType } from '@/lib/types';
import { getSession } from '@/lib/auth';
import type { FilmDetails, PublicUser } from '@/lib/types';

async function getUserData(userId: string) {
    const session = await getSession();
    const currentUser = session?.user;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
          id: true,
          name: true,
          username: true,
          imageUrl: true,
          bio: true,
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

    if (!dbUser) {
        return null;
    }

    const [watchlist, likes] = await Promise.all([
      prisma.watchlistItem.findMany({ where: { userId }, select: { filmId: true } }),
      prisma.likedFilm.findMany({ where: { userId }, select: { filmId: true } }),
    ]);

    const watchlistIds = new Set(watchlist.map(item => item.filmId));
    const likedIds = new Set(likes.map(item => item.filmId));

    let isFollowing = false;
    if (currentUser && currentUser.id !== userId) {
        const follow = await prisma.follows.findUnique({
            where: { followerId_followingId: { followerId: currentUser.id, followingId: userId } }
        });
        isFollowing = !!follow;
    }

    return {
        user: {
            id: dbUser.id,
            name: dbUser.name,
            username: dbUser.username,
            imageUrl: dbUser.imageUrl,
            bio: dbUser.bio,
        },
        stats: {
            journalCount: dbUser._count.journalEntries,
            followersCount: dbUser._count.followers,
            followingCount: dbUser._count.following,
            likesCount: dbUser._count.likes + dbUser._count.likedLists,
            favoriteFilms: dbUser.favoriteFilms.map(fav => ({ ...fav.film, id: fav.film.id.toString() })) as FilmType[],
            watchlistIds,
            likedIds,
            recentJournalEntries: dbUser.journalEntries.map(entry => ({
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
        isCurrentUser: currentUser?.id === userId
    }
}


export default async function OtherUserProfilePage({ params }: { params: { id: string } }) {
    const session = await getSession();
    const currentUser = session?.user;

    if (!currentUser) {
        redirect("/login");
    }

    if (currentUser.id === params.id) {
        redirect("/profile");
    }

    const userData = await getUserData(params.id);

    if (!userData) {
        notFound();
    }

    return <ProfilePageContent 
                user={userData.user as PublicUser} 
                stats={userData.stats} 
                isCurrentUser={userData.isCurrentUser}
                isFollowing={userData.isFollowing}
            />;
}
