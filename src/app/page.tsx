import { getPopularMovies, getTopRatedMovies, getNowPlayingMovies } from '@/lib/tmdb';
import { FilmCarouselSection } from '@/components/film-carousel-section';
import { FollowingFeed } from '@/components/following-feed';
import { Separator } from '@/components/ui/separator';
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from '@clerk/nextjs/server';
import { Users } from 'lucide-react';
import type { Film } from '@/lib/types';
import prisma from '@/lib/prisma';

async function getUserFilmSets(userId: string | null) {
    if (!userId) {
        return { watchlistIds: new Set<number>(), likedIds: new Set<number>() };
    }

    const [watchlist, likes] = await Promise.all([
        prisma.watchlistItem.findMany({
            where: { userId },
            select: { filmId: true }
        }),
        prisma.likedFilm.findMany({
            where: { userId },
            select: { filmId: true }
        }),
    ]);

    const watchlistIds = new Set(watchlist.map(item => item.filmId));
    const likedIds = new Set(likes.map(item => item.filmId));

    return { watchlistIds, likedIds };
}


export default async function HomePage() {
  const { userId } = auth();

  const [
    popularFilms,
    topRatedFilms,
    recentFilms,
    userFilmSets
  ] = await Promise.all([
    getPopularMovies(),
    getTopRatedMovies(),
    getNowPlayingMovies(),
    getUserFilmSets(userId)
  ]);

  return (
    <div className="space-y-12">
      <SignedOut>
        <div className="text-center py-8">
          <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl text-foreground">Welcome to FlickTrack</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Your personal film journal. Discover, log, and share your favorite films.</p>
        </div>
      </SignedOut>

      <SignedIn>
         <section className="space-y-6">
            <div className="flex items-center gap-3">
                <Users className="w-7 h-7 text-primary/80" />
                <h2 className="text-3xl font-headline font-bold text-foreground tracking-tight">Following Activity</h2>
            </div>
            <FollowingFeed />
          </section>
          <Separator />
      </SignedIn>
      
      <div className="space-y-12">
        <FilmCarouselSection title="Popular Films" films={popularFilms} watchlistIds={userFilmSets.watchlistIds} likedIds={userFilmSets.likedIds} />
        <FilmCarouselSection title="Top Rated Films" films={topRatedFilms} watchlistIds={userFilmSets.watchlistIds} likedIds={userFilmSets.likedIds} />
        <FilmCarouselSection title="Now Playing" films={recentFilms} watchlistIds={userFilmSets.watchlistIds} likedIds={userFilmSets.likedIds} />
      </div>
    </div>
  )}
