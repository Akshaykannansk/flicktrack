
import { getPopularMovies, getTopRatedMovies, getNowPlayingMovies } from '@/lib/tmdb';
import { FilmCarouselSection } from '@/components/film-carousel-section';
import { FollowingFeed } from '@/components/following-feed';
import { Separator } from '@/components/ui/separator';
import { Users, TrendingUp } from 'lucide-react';
import React from 'react';
import { FilmCarouselSkeleton } from '@/components/film-carousel-skeleton';
import { TrendingReviews } from '@/components/trending-reviews';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserFilmSets } from '@/services/userService';
import type { Film } from '@/lib/types';
import type { CookieOptions } from '@supabase/ssr';

async function PopularFilms({ watchlistIds, likedIds }: { watchlistIds: Set<number>, likedIds: Set<number> }) {
  const popularMovies = await getPopularMovies();
  return <FilmCarouselSection 
    title="Popular Films" 
    initialFilms={popularMovies} 
    category="popular"
    watchlistIds={watchlistIds} 
    likedIds={likedIds} 
  />;
}

async function TopRatedFilms({ watchlistIds, likedIds }: { watchlistIds: Set<number>, likedIds: Set<number> }) {
  const topRatedMovies = await getTopRatedMovies();
  return <FilmCarouselSection 
    title="Top Rated Films" 
    initialFilms={topRatedMovies}
    category="top_rated"
    watchlistIds={watchlistIds} 
    likedIds={likedIds} 
  />;
}

async function NowPlayingFilms({ watchlistIds, likedIds }: { watchlistIds: Set<number>, likedIds: Set<number> }) {
  const nowPlayingMovies = await getNowPlayingMovies();
  return <FilmCarouselSection 
    title="Now Playing" 
    initialFilms={nowPlayingMovies}
    category="now_playing"
    watchlistIds={watchlistIds} 
    likedIds={likedIds} 
  />;
}


export default async function HomePage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  // Fetch user-specific data first, as it's quick and needed by all carousels.
  const { watchlistIds, likedIds } = await getUserFilmSets(user?.id ?? null);

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
              <TrendingReviews />
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
            <FollowingFeed />
          </section>
          <Separator />
          <section className="space-y-6">
            <div className="flex items-center gap-3">
                <TrendingUp className="w-7 h-7 text-primary/80" />
                <h2 className="text-3xl font-headline font-bold text-foreground tracking-tight">Trending Reviews</h2>
            </div>
             <TrendingReviews />
          </section>
          <Separator />
        </>
      )}
      
      <div className="space-y-12">
        <React.Suspense fallback={<FilmCarouselSkeleton title="Popular Films" />}>
           <PopularFilms watchlistIds={watchlistIds} likedIds={likedIds} />
        </React.Suspense>

        <React.Suspense fallback={<FilmCarouselSkeleton title="Top Rated Films" />}>
          <TopRatedFilms watchlistIds={watchlistIds} likedIds={likedIds} />
        </React.Suspense>

        <React.Suspense fallback={<FilmCarouselSkeleton title="Now Playing" />}>
          <NowPlayingFilms watchlistIds={watchlistIds} likedIds={likedIds} />
        </React.Suspense>
      </div>
    </div>
  )
}
