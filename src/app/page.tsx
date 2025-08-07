
import { getPopularMovies, getTopRatedMovies, getNowPlayingMovies } from '@/lib/tmdb';
import { FilmCarouselSection } from '@/components/film-carousel-section';
import { FollowingFeed } from '@/components/following-feed';
import { Separator } from '@/components/ui/separator';
import { SignedIn, SignedOut, auth } from '@clerk/nextjs';
import { Users } from 'lucide-react';
import prisma from '@/lib/prisma';


export const dynamic = 'force-dynamic';

async function getUserFilmSets(userId: string | null) {
    if (!userId) {
        return { watchlistIds: new Set<number>(), favoriteIds: new Set<number>() };
    }

    const [watchlist, userWithFavorites] = await Promise.all([
        prisma.watchlistItem.findMany({
            where: { userId },
            select: { filmId: true }
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { favoriteFilms: { select: { id: true } } }
        })
    ]);

    const watchlistIds = new Set(watchlist.map(item => item.filmId));
    const favoriteIds = new Set(userWithFavorites?.favoriteFilms.map(film => film.id) ?? []);

    return { watchlistIds, favoriteIds };
}


export default async function HomePage() {
  const { userId } = auth();
  const [
    popularFilms,
    topRatedFilms,
    recentFilms,
    { watchlistIds, favoriteIds }
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
          <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl text-primary-foreground">Welcome to FlickTrack</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Your personal film journal. Discover, log, and share your favorite films.</p>
        </div>
      </SignedOut>

      <SignedIn>
         <section className="space-y-6">
            <div className="flex items-center gap-3">
                <Users className="w-7 h-7 text-primary/80" />
                <h2 className="text-3xl font-headline font-bold text-primary-foreground tracking-tight">Following Activity</h2>
            </div>
            <FollowingFeed />
          </section>
          <Separator />
      </SignedIn>
      
      <div className="space-y-12">
        <FilmCarouselSection title="Popular Films" films={popularFilms} watchlistIds={watchlistIds} favoriteIds={favoriteIds} />
        <FilmCarouselSection title="Top Rated Films" films={topRatedFilms} watchlistIds={watchlistIds} favoriteIds={favoriteIds} />
        <FilmCarouselSection title="Now Playing" films={recentFilms} watchlistIds={watchlistIds} favoriteIds={favoriteIds} />
      </div>
    </div>
  );
}

