
import prisma from "@/lib/prisma";
import { upsertFilm } from "./filmService";

export async function getJournalEntriesForUser(userId: string, take?: number, include?: ('film' | 'user')[]) {
    return prisma.journalEntry.findMany({
      where: { userId },
      include: {
        film: include?.includes('film') ?? true,
        user: include?.includes('user') ?? false,
      },
      orderBy: { logged_date: 'desc' },
      take,
    });
}

export async function createJournalEntry(userId: string, data: { filmId: number, rating: number, review?: string, loggedDate: string }) {
    await upsertFilm(data.filmId);
    return prisma.journalEntry.create({
        data: {
            userId,
            filmId: data.filmId,
            rating: data.rating,
            review: data.review,
            logged_date: data.loggedDate,
        },
    });
}

export async function getJournalEntry(id: string) {
    return prisma.journalEntry.findUnique({
        where: { id },
        include: { film: true },
    });
}

export async function getJournalEntryWithDetails(id: string) {
    return prisma.journalEntry.findUnique({
        where: { id },
        include: { 
            film: true,
            user: { select: { id: true, name: true, username: true, imageUrl: true } },
            reviewLikes: true,
            _count: {
                select: { reviewLikes: true, comments: true }
            }
        },
    });
}


export async function updateJournalEntry(id: string, userId: string, data: { rating?: number, review?: string, loggedDate?: string }) {
    return prisma.journalEntry.update({
        where: { id, userId },
        data,
    });
}

export async function deleteJournalEntry(id: string, userId: string) {
    return prisma.journalEntry.delete({
        where: { id, userId },
    });
}

export async function getTrendingReviews(userId?: string) {
    const reviews = await prisma.journalEntry.findMany({
        where: {
            review: { not: null, notIn: [''] }
        },
        include: {
            film: true,
            user: { select: { id: true, name: true, username: true, imageUrl: true } },
            reviewLikes: userId ? { where: { userId } } : false,
            _count: { select: { reviewLikes: true, comments: true } }
        },
        orderBy: { reviewLikes: { _count: 'desc' } },
        take: 10,
    });

    // Sort by a combination of likes and recency
    return reviews.sort((a, b) => {
        const scoreA = a._count.reviewLikes * 2 + (new Date(a.createdAt).getTime() / (1000 * 60 * 60 * 24));
        const scoreB = b._count.reviewLikes * 2 + (new Date(b.createdAt).getTime() / (1000 * 60 * 60 * 24));
        return scoreB - scoreA;
    });
}


export async function likeReview(userId: string, journalEntryId: string) {
    const journalEntry = await prisma.journalEntry.findUnique({
      where: { id: journalEntryId },
      select: { userId: true },
    });

    if (!journalEntry) {
        return { success: false, error: 'Review not found.', status: 404 };
    }
    if (journalEntry.userId === userId) {
        return { success: false, error: 'You cannot like your own review.', status: 400 };
    }

    await prisma.reviewLike.create({
      data: { userId, journalEntryId },
    });

    return { success: true };
}

export async function unlikeReview(userId: string, journalEntryId: string) {
    return prisma.reviewLike.delete({
        where: { userId_journalEntryId: { userId, journalEntryId } },
    });
}


// COMMENTS

export async function getCommentsForReview(journalEntryId: string) {
    return prisma.comment.findMany({
        where: { journalEntryId },
        include: { user: { select: { id: true, name: true, username: true, imageUrl: true } } },
        orderBy: { createdAt: 'asc' },
    });
}

export async function createComment(userId: string, journalEntryId: string, content: string) {
    return prisma.comment.create({
        data: { content, userId, journalEntryId },
        include: { user: { select: { id: true, name: true, username: true, imageUrl: true } } },
    });
}

export async function getCommentById(id: string) {
    return prisma.comment.findUnique({
        where: { id },
        select: { userId: true },
    });
}

export async function deleteComment(id: string) {
    return prisma.comment.delete({
        where: { id },
    });
}

// FILM-SPECIFIC COMMUNITY DATA
export async function getRatingsDistribution(filmId: number) {
  const ratings = await prisma.journalEntry.groupBy({
    by: ['rating'],
    where: { filmId },
    _count: {
      rating: true,
    },
  });

  // Convert to a map for easier lookup and ensure all ratings are present
  const distributionMap = new Map<number, number>();
  for (let i = 0.5; i <= 5; i += 0.5) {
      distributionMap.set(i, 0);
  }

  ratings.forEach(item => {
    distributionMap.set(item.rating, item._count.rating);
  });
  
  // Convert map to array of objects for the chart
  return Array.from(distributionMap.entries()).map(([rating, count]) => ({
    name: `${rating} Stars`,
    rating: rating,
    count: count,
  }));
}

export async function getRecentReviewsForFilm(filmId: number, currentUserId?: string) {
    return prisma.journalEntry.findMany({
        where: {
            filmId,
            review: { not: null, notIn: [''] },
        },
        include: {
            user: { select: { id: true, name: true, username: true, imageUrl: true } },
            reviewLikes: currentUserId ? { where: { userId: currentUserId } } : false,
            _count: { select: { reviewLikes: true, comments: true } }
        },
        orderBy: {
            logged_date: 'desc'
        },
        take: 10,
    })
}

export async function searchReviews(query: string, limit = 20) {
    if (!query) return [];

    return prisma.journalEntry.findMany({
        where: {
            review: { 
                contains: query, 
                mode: 'insensitive',
                not: null,
                notIn: ['']
            }
        },
        take: limit,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    imageUrl: true,
                }
            },
            film: {
                select: {
                    title: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}
