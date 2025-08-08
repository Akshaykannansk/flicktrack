
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
    return prisma.journalEntry.findMany({
        where: {
            review: { not: null, notIn: [''] }
        },
        include: {
            film: true,
            user: { select: { id: true, name: true, username: true, imageUrl: true } },
            reviewLikes: userId ? { where: { userId } } : false,
            _count: { select: { reviewLikes: true, comments: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
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
