
import prisma from "@/lib/prisma";
import type { Film } from "@/lib/types";

export async function getUserProfile<T extends (keyof (typeof prisma.user.fields))[]>(userId: string, fields: T) {
    const select = fields.reduce((obj, field) => ({ ...obj, [field]: true }), {});
    return prisma.user.findUnique({
        where: { id: userId },
        select: select,
    });
}

export async function updateUserProfile(userId: string, data: { name: string, username: string, bio?: string }) {
    return prisma.user.update({
        where: { id: userId },
        data,
    });
}

export async function searchUsers(query: string) {
    if (!query) return [];
    return prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { username: { contains: query, mode: 'insensitive' } },
            ],
        },
        take: 10,
        select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
        }
    });
}

export async function followUser(followerId: string, followingId: string) {
    return prisma.follows.create({
        data: { followerId, followingId },
    });
}

export async function unfollowUser(followerId: string, followingId: string) {
    return prisma.follows.delete({
        where: { followerId_followingId: { followerId, followingId } },
    });
}

export async function getFollowingFeedForUser(userId: string | null) {
    if (!userId) return [];

    const follows = await prisma.follows.findMany({
        where: { followerId: userId },
        select: { followingId: true },
    });

    const followingIds = follows.map(f => f.followingId);

    if (followingIds.length === 0) return [];
    
    return prisma.journalEntry.findMany({
        where: { userId: { in: followingIds } },
        include: {
            film: true,
            user: {
                select: { id: true, name: true, username: true, imageUrl: true },
            },
            reviewLikes: userId ? { where: { userId } } : false,
             _count: {
                select: { reviewLikes: true, comments: true },
            }
        },
        orderBy: { logged_date: 'desc' },
        take: 20
    });
}

export async function getUserFilmSets(userId: string | null) {
    if (!userId) {
        return { watchlistIds: new Set<number>(), likedIds: new Set<number>() };
    }

    const [watchlist, likes] = await Promise.all([
        prisma.watchlistItem.findMany({ where: { userId }, select: { filmId: true } }),
        prisma.likedFilm.findMany({ where: { userId }, select: { filmId: true } }),
    ]);

    const watchlistIds = new Set(watchlist.map(item => item.filmId));
    const likedIds = new Set(likes.map(item => item.filmId));

    return { watchlistIds, likedIds };
}

export async function getUserDataForProfile(userId: string, currentUserId?: string) {
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
            likedFilms: true,
            likedLists: true,
          }
        },
        favoriteFilms: { include: { film: true }, orderBy: { addedAt: 'asc' } },
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

    const { watchlistIds, likedIds } = await getUserFilmSets(userId);

    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
        const follow = await prisma.follows.findUnique({
            where: { followerId_followingId: { followerId: currentUserId, followingId: userId } }
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
            likesCount: dbUser._count.likedFilms + dbUser._count.likedLists,
            favoriteFilms: dbUser.favoriteFilms.map(fav => ({ ...fav.film, id: fav.film.id.toString() })) as Film[],
            watchlistIds,
            likedIds,
            recentJournalEntries: dbUser.journalEntries.map(entry => ({
                id: entry.id,
                film: { ...entry.film, id: entry.film.id.toString() },
                rating: entry.rating,
                review: entry.review || undefined,
                loggedDate: entry.logged_date
            })) || []
        },
        isFollowing,
        isCurrentUser: currentUserId === userId
    }
}
