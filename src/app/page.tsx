
import { getPopularMovies, getTopRatedMovies, getNowPlayingMovies } from '@/lib/tmdb';
import { FilmCarouselSection } from '@/components/film-carousel-section';
import { FollowingFeed, FeedSkeleton } from '@/components/following-feed';
import { Separator } from '@/components/ui/separator';
import { Users, TrendingUp } from 'lucide-react';
import React, { Suspense } from 'react';
import { TrendingReviews } from '@/components/trending-reviews';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserFilmSets, getFollowingFeedForUser } from '@/services/userService';
import { getTrendingReviews as fetchTrendingReviews } from '@/services/reviewService';
import type { CookieOptions } from '@supabase/ssr';
import { LazyCarouselSection } from '@/components/LazyCarouselSection';

export default async function HomePage() {
  const cookieStore = await cookies();
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
  
  // Fetch data for feeds
  const followingFeed = await getFollowingFeedForUser(user?.id ?? null) as any[];
  const trendingReviews = await fetchTrendingReviews(user?.id) as any[];

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
              <TrendingReviews reviews={trendingReviews} />
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
            <FollowingFeed feed={followingFeed} currentUserId={user.id} />
          </section>
          <Separator />
          <section className="space-y-6">
            <div className="flex items-center gap-3">
                <TrendingUp className="w-7 h-7 text-primary/80" />
                <h2 className="text-3xl font-headline font-bold text-foreground tracking-tight">Trending Reviews</h2>
            </div>
             <TrendingReviews reviews={trendingReviews} currentUserId={user.id} />
          </section>
          <Separator />
        </>
      )}
      
      <div className="space-y-12">
        <LazyCarouselSection title="Popular Films">
          <FilmCarouselSection
            title="Popular Films"
            initialFilms={await getPopularMovies()}
            category="popular"
            watchlistIds={watchlistIds}
            likedIds={likedIds}
          />
        </LazyCarouselSection>

        <LazyCarouselSection title="Top Rated Films">
          <FilmCarouselSection
            title="Top Rated Films"
            initialFilms={await getTopRatedMovies()}
            category="top_rated"
            watchlistIds={watchlistIds}
            likedIds={likedIds}
          />
        </LazyCarouselSection>

        <LazyCarouselSection title="Now Playing">
          <FilmCarouselSection
            title="Now Playing"
            initialFilms={await getNowPlayingMovies()}
            category="now_playing"
            watchlistIds={watchlistIds}
            likedIds={likedIds}
          />
        </LazyCarouselSection>
      </div>
    </div>
  )
}
