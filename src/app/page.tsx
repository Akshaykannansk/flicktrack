
'use client';

import { useEffect, useState } from 'react';
import { getPopularMovies, getTopRatedMovies, getNowPlayingMovies } from '@/lib/tmdb';
import { FilmCarouselSection } from '@/components/film-carousel-section';
import { FollowingFeed } from '@/components/following-feed';
import { Separator } from '@/components/ui/separator';
import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import { Users } from 'lucide-react';
import type { Film } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const [popularFilms, setPopularFilms] = useState<Film[]>([]);
  const [topRatedFilms, setTopRatedFilms] = useState<Film[]>([]);
  const [recentFilms, setRecentFilms] = useState<Film[]>([]);
  const [userFilmSets, setUserFilmSets] = useState<{ watchlistIds: Set<number>; likedIds: Set<number> }>({ watchlistIds: new Set(), likedIds: new Set() });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    async function fetchMovies() {
      try {
        const [popular, topRated, recent] = await Promise.all([
          getPopularMovies(),
          getTopRatedMovies(),
          getNowPlayingMovies(),
        ]);
        setPopularFilms(popular);
        setTopRatedFilms(topRated);
        setRecentFilms(recent);
      } catch (error) {
        console.error("Failed to fetch movies:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    async function fetchUserSets() {
        if (user) {
             try {
                const [watchlistRes, likesRes] = await Promise.all([
                    fetch('/api/watchlist'),
                    fetch('/api/films/likes')
                ]);

                let watchlistIds = new Set<number>();
                if (watchlistRes.ok) {
                    const watchlistData: { film: Film }[] = await watchlistRes.json();
                    watchlistIds = new Set(watchlistData.map(item => parseInt(item.film.id, 10)));
                }

                let likedIds = new Set<number>();
                if (likesRes.ok) {
                    const likesData: { film: Film }[] = await likesRes.json();
                    likedIds = new Set(likesData.map(item => parseInt(item.film.id, 10)));
                }
                setUserFilmSets({ watchlistIds, likedIds });
             } catch (error) {
                 console.error("Failed to fetch user film sets:", error);
             }
        }
    }

    fetchMovies();
    fetchUserSets();

  }, [user]);

  const FilmCarouselSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/4" />
       <div className="flex space-x-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-1/6 space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
       </div>
    </div>
  )

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
        {isLoading ? (
          <>
            <FilmCarouselSkeleton />
            <FilmCarouselSkeleton />
            <FilmCarouselSkeleton />
          </>
        ) : (
          <>
            <FilmCarouselSection title="Popular Films" films={popularFilms} watchlistIds={userFilmSets.watchlistIds} likedIds={userFilmSets.likedIds} />
            <FilmCarouselSection title="Top Rated Films" films={topRatedFilms} watchlistIds={userFilmSets.watchlistIds} likedIds={userFilmSets.likedIds} />
            <FilmCarouselSection title="Now Playing" films={recentFilms} watchlistIds={userFilmSets.watchlistIds} likedIds={userFilmSets.likedIds} />
          </>
        )}
      </div>
    </div>
  )}