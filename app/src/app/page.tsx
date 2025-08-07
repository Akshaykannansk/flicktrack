import { getPopularMovies, getTopRatedMovies, getNowPlayingMovies } from '@/lib/tmdb';
import { FilmCarouselSection } from '@/components/film-carousel-section';
import { FollowingFeed } from '@/components/following-feed';
import { Separator } from '@/components/ui/separator';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Users } from 'lucide-react';


export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const popularFilms = await getPopularMovies();
  const topRatedFilms = await getTopRatedMovies();
  const recentFilms = await getNowPlayingMovies();

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
        <FilmCarouselSection title="Popular Films" films={popularFilms} />
        <FilmCarouselSection title="Top Rated Films" films={topRatedFilms} />
        <FilmCarouselSection title="Now Playing" films={recentFilms} />
      </div>
    </div>
  );
}
