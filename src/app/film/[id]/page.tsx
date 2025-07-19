import { films } from '@/lib/data';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Star, Bookmark, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogFilmDialog } from '@/components/log-film-dialog';

export function generateStaticParams() {
  return films.map((film) => ({
    id: film.id,
  }));
}

export default function FilmDetailPage({ params }: { params: { id: string } }) {
  const film = films.find((f) => f.id === params.id);

  if (!film) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg shadow-primary/10">
            <Image
              src={film.posterUrl}
              alt={`Poster for ${film.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
              data-ai-hint={`${film.title} movie poster`}
            />
          </div>
        </div>
        <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-headline font-bold tracking-tighter">{film.title}</h1>
            <div className="flex items-center space-x-4 text-muted-foreground mt-2">
              <span>{film.year}</span>
              <span>Directed by <span className="text-primary-foreground font-semibold">{film.director}</span></span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-primary">
                <span className="sr-only">Average rating: {film.averageRating} out of 5 stars</span>
                {[...Array(Math.floor(film.averageRating))].map((_, i) => <Star key={`full-${i}`} aria-hidden="true" className="w-5 h-5 fill-current" />)}
                {film.averageRating % 1 !== 0 && <Star key="half" aria-hidden="true" className="w-5 h-5 fill-current" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
                {[...Array(5-Math.ceil(film.averageRating))].map((_, i) => <Star key={`empty-${i}`} aria-hidden="true" className="w-5 h-5" />)}
            </div>
            <span className="font-bold text-lg text-primary-foreground">{film.averageRating.toFixed(1)}</span>
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
            <LogFilmDialog film={film}>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <PlusCircle className="mr-2 h-5 w-5" /> Log Film
              </Button>
            </LogFilmDialog>
            <Button size="lg" variant="outline">
                <Bookmark className="mr-2 h-5 w-5" /> Add to Watchlist
            </Button>
          </div>
          <Separator className="my-6 !mt-8" />
          <div>
            <h2 className="text-2xl font-headline font-semibold">Plot Summary</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed max-w-prose">{film.plot}</p>
          </div>
           <div>
            <h2 className="text-2xl font-headline font-semibold">Cast</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {film.cast.map((actor) => (
                <Badge key={actor} variant="secondary">{actor}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
