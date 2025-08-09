
import prisma from "@/lib/prisma";
import { getFilmDetails } from "@/lib/tmdb";

export async function upsertFilm(filmId: number) {
    const filmDetails = await getFilmDetails(filmId.toString());
    if (filmDetails) {
        return prisma.film.upsert({
            where: { id: filmId },
            update: {
                title: filmDetails.title,
                overview: filmDetails.overview,
                poster_path: filmDetails.poster_path,
                release_date: filmDetails.release_date ? new Date(filmDetails.release_date) : null,
                vote_average: filmDetails.vote_average,
            },
            create: {
                id: filmId,
                title: filmDetails.title,
                overview: filmDetails.overview,
                poster_path: filmDetails.poster_path,
                release_date: filmDetails.release_date ? new Date(filmDetails.release_date) : null,
                vote_average: filmDetails.vote_average,
            }
        });
    }
    // Fallback for when TMDB fails
    return prisma.film.upsert({
        where: { id: filmId },
        update: {},
        create: { id: filmId, title: 'Unknown Film' },
    });
}

// WATCHLIST
export async function getWatchlist(userId: string) {
    return prisma.watchlistItem.findMany({
        where: { userId },
        include: { film: true },
        orderBy: { addedAt: 'desc' },
    });
}

export async function addToWatchlist(userId: string, filmId: number) {
    await upsertFilm(filmId);
    return prisma.watchlistItem.create({
        data: { userId, filmId },
    });
}

export async function removeFromWatchlist(userId: string, filmId: number) {
    return prisma.watchlistItem.delete({
        where: { userId_filmId: { userId, filmId } },
    });
}

export async function getWatchlistStatusForFilm(filmId: number, userId: string | null) {
  if (!userId) {
    return false;
  }
  const item = await prisma.watchlistItem.findUnique({
    where: { userId_filmId: { userId, filmId } },
  });
  return !!item;
}


// LIKED FILMS
export async function getLikedFilms(userId: string) {
    return prisma.likedFilm.findMany({
        where: { userId },
        include: { film: true },
        orderBy: { createdAt: 'desc' },
    });
}

export async function likeFilm(userId: string, filmId: number) {
    await upsertFilm(filmId);
    return prisma.likedFilm.create({
        data: { userId, filmId },
    });
}

export async function unlikeFilm(userId: string, filmId: number) {
    return prisma.likedFilm.delete({
        where: { userId_filmId: { userId, filmId } },
    });
}


// FAVORITE FILMS
export async function getFavoriteFilms(userId: string) {
    return prisma.favoriteFilm.findMany({
      where: { userId },
      include: { film: true },
      orderBy: { addedAt: 'asc' },
    });
}

export async function updateFavoriteFilms(userId: string, filmIds: number[]) {
     for (const filmId of filmIds) {
        await upsertFilm(filmId);
    }
    
    await prisma.$transaction(async (tx) => {
        await tx.favoriteFilm.deleteMany({
            where: { userId: userId },
        });

        if (filmIds.length > 0) {
            await tx.favoriteFilm.createMany({
                data: filmIds.map(id => ({ userId, filmId: id, addedAt: new Date() })),
            });
        }
    });

    return getFavoriteFilms(userId);
}
