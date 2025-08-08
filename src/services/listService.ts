
import prisma from "@/lib/prisma";
import { upsertFilm } from "./filmService";

export async function getListsForUser(userId: string) {
    return prisma.filmList.findMany({
        where: { userId },
        include: {
            films: {
                take: 4,
                orderBy: { addedAt: 'desc' },
                include: { film: { select: { id: true, poster_path: true } } },
            },
            _count: { select: { films: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function createList(userId: string, name: string, description?: string) {
    return prisma.filmList.create({
        data: { userId, name, description },
    });
}

export async function getListById(listId: string) {
    return prisma.filmList.findUnique({
        where: { id: listId },
        include: {
            user: { select: { id: true, name: true, username: true } },
            films: {
                include: { film: true },
                orderBy: { addedAt: 'desc' },
            },
            _count: { select: { likedBy: true } },
        },
    });
}

export async function updateList(listId: string, userId: string, data: { name?: string; description?: string }) {
    return prisma.filmList.update({
        where: { id: listId, userId },
        data,
    });
}

export async function deleteList(listId: string, userId: string) {
    return prisma.filmList.delete({
        where: { id: listId, userId },
    });
}

export async function addFilmToList(listId: string, filmId: number) {
    await upsertFilm(filmId);
    return prisma.filmsOnList.create({
        data: { listId, filmId },
    });
}

export async function copyList(listToCopyId: string, newOwnerId: string) {
    const originalList = await prisma.filmList.findUnique({
        where: { id: listToCopyId },
        include: { films: { select: { filmId: true } } },
    });

    if (!originalList || originalList.userId === newOwnerId) {
        return null;
    }

    return prisma.$transaction(async (tx) => {
        const createdList = await tx.filmList.create({
            data: {
                name: `${originalList.name} (Copy)`,
                description: originalList.description,
                userId: newOwnerId,
            },
        });

        if (originalList.films.length > 0) {
            await tx.filmsOnList.createMany({
                data: originalList.films.map(film => ({
                    listId: createdList.id,
                    filmId: film.filmId,
                })),
            });
        }
        return createdList;
    });
}


// LIKED LISTS

export async function getLikedListsWithDetails(userId: string) {
    return prisma.likedList.findMany({
        where: { userId },
        include: {
            list: {
                include: {
                    films: {
                        take: 4,
                        include: { film: { select: { id: true, poster_path: true } } },
                    },
                    _count: { select: { films: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getLikedListsIds(userId: string) {
    return prisma.likedList.findMany({
        where: { userId },
        select: { listId: true },
        orderBy: { createdAt: 'desc' },
    });
}

export async function likeList(userId: string, listId: string) {
    const list = await prisma.filmList.findUnique({
        where: { id: listId },
        select: { userId: true },
    });

    if (!list) {
        return { success: false, error: 'List not found', status: 404 };
    }
    if (list.userId === userId) {
        return { success: false, error: 'You cannot like your own list.', status: 400 };
    }

    await prisma.likedList.create({
        data: { userId, listId },
    });

    return { success: true };
}

export async function unlikeList(userId: string, listId: string) {
    return prisma.likedList.delete({
        where: { userId_listId: { userId, listId } },
    });
}
