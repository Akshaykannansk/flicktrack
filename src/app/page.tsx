
import { getPopularMovies, getTopRatedMovies, getNowPlayingMovies } from '@/lib/tmdb';
import { FilmCarouselSection } from '@/components/film-carousel-section';
import { FollowingFeed } from '@/components/following-feed';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/server';
import { Users, TrendingUp } from 'lucide-react';
import prisma from '@/lib/prisma';
import React from 'react';
import { FilmCarouselSkeleton } from '@/components/film-carousel-skeleton';
import { FeedSkeleton } from '@/components/following-feed';
import { TrendingReviews } from '@/components/trending-reviews';

async function getUserFilmSets(userId: string | null) {
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


export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Pre-fetch the first page of each category and user-specific data in parallel
  const [
    userFilmSets,
    popularMovies,
    topRatedMovies,
    nowPlayingMovies
  ] = await Promise.all([
    getUserFilmSets(user?.id ?? null),
    getPopularMovies(),
    getTopRatedMovies(),
    getNowPlayingMovies()
  ]);

  const { watchlistIds, likedIds } = userFilmSets;

  return (
    <div className="space-y-12">
      {!user ? (
        <>
          <div className="text-center py-8">
            <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl text-foreground">Welcome to FlickTrack</h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Your personal film journal. Discover, log, and share your favorite films.</p>
          </div>
           <section className="space-y-6">
              <div className="flex items-center gap-3">
                  <TrendingUp className="w-7 h-7 text-primary/80" />
                  <h2 className="text-3xl font-headline font-bold text-foreground tracking-tight">Trending Reviews</h2>
              </div>
               <React.Suspense fallback={<FeedSkeleton />}>
                <TrendingReviews />
              </React.Suspense>
            </section>
            <Separator />
        </>
      ) : (
        <>
         <section className="space-y-6">
            <div className="flex items-center gap-3">
                <Users className="w-7 h-7 text-primary/80" />
                <h2 className="text-3xl font-headline font-bold text-foreground tracking-tight">Following Activity</h2>
            </div>
            <React.Suspense fallback={<FeedSkeleton />}>
              <FollowingFeed />
            </React.Suspense>
          </section>
          <Separator />
          <section className="space-y-6">
            <div className="flex items-center gap-3">
                <TrendingUp className="w-7 h-7 text-primary/80" />
                <h2 className="text-3xl font-headline font-bold text-foreground tracking-tight">Trending Reviews</h2>
            </div>
             <React.Suspense fallback={<FeedSkeleton />}>
              <TrendingReviews />
            </React.Suspense>
          </section>
          <Separator />
        </>
      )}
      
      <div className="space-y-12">
        <React.Suspense fallback={<FilmCarouselSkeleton title="Popular Films" />}>
           <FilmCarouselSection 
              title="Popular Films" 
              initialFilms={popularMovies} 
              category="popular"
              watchlistIds={watchlistIds} 
              likedIds={likedIds} 
            />
        </React.Suspense>
        <React.Suspense fallback={<FilmCarouselSkeleton title="Top Rated Films" />}>
          <FilmCarouselSection 
              title="Top Rated Films" 
              initialFilms={topRatedMovies}
              category="top_rated"
              watchlistIds={watchlistIds} 
              likedIds={likedIds} 
            />
        </React.Suspense>
        <React.Suspense fallback={<FilmCarouselSkeleton title="Now Playing" />}>
          <FilmCarouselSection 
              title="Now Playing" 
              initialFilms={nowPlayingMovies}
              category="now_playing"
              watchlistIds={watchlistIds} 
              likedIds={likedIds} 
            />
        </React.Suspense>
      </div>
    </div>
  )
}
