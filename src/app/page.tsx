import { getPopularMovies, getTopRatedMovies, getNowPlayingMovies } from '@/lib/tmdb';
import { FilmCarouselSection } from '@/components/film-carousel-section';

export default async function HomePage() {
  const popularFilms = await getPopularMovies();
  const topRatedFilms = await getTopRatedMovies();
  const recentFilms = await getNowPlayingMovies();

  return (
    <div className="space-y-12">
      <div className="text-center py-8">
        <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl text-primary-foreground">Welcome to FlickTrack</h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Your personal film journal. Discover, log, and share your favorite films.</p>
      </div>
      
      <div className="space-y-12">
        <FilmCarouselSection title="Popular Films" films={popularFilms} />
        <FilmCarouselSection title="Top Rated Films" films={topRatedFilms} />
        <FilmCarouselSection title="Now Playing" films={recentFilms} />
      </div>
    </div>
  );
}
