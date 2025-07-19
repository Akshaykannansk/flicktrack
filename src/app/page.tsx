import { getPopularMovies, getTopRatedMovies, getNowPlayingMovies, IMAGE_BASE_URL } from '@/lib/tmdb';
import type { Film } from '@/lib/types';
import { FilmCard } from '@/components/film-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

export default async function HomePage() {
  const popularFilms = await getPopularMovies();
  const topRatedFilms = await getTopRatedMovies();
  const recentFilms = await getNowPlayingMovies();

  const Section = ({ title, films }: { title: string, films: Film[] }) => (
    <section className="space-y-4">
      <h2 className="text-2xl font-headline font-bold text-primary-foreground tracking-tight">{title}</h2>
      <Carousel opts={{ align: "start", dragFree: true }}>
        <CarouselContent className="-ml-2 md:-ml-4">
          {films.map((film, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-1/8">
              <FilmCard film={film} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </section>
  );

  return (
    <div className="space-y-12">
      <div className="text-center py-8">
        <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl text-primary-foreground">Welcome to FlickTrack</h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Your personal film journal. Discover, log, and share your favorite films.</p>
      </div>
      
      <div className="space-y-12">
        <Section title="Popular Films" films={popularFilms} />
        <Section title="Top Rated Films" films={topRatedFilms} />
        <Section title="Now Playing" films={recentFilms} />
      </div>
    </div>
  );
}
