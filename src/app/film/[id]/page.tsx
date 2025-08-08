
import { getFilmDetails as getFilmDetailsFromTMDB } from '@/lib/tmdb';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Star, PlusCircle, Film as FilmIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogFilmDialog } from '@/components/log-film-dialog';
import { WatchlistButton } from '@/components/watchlist-button';
import redis from '@/lib/redis';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { FilmDetails } from '@/lib/types';
import { getWatchlistStatusForFilm } from '@/services/filmService';

const CACHE_EXPIRATION_SECONDS = 60 * 60 * 24; // 24 hours

async function getFilmDetails(id: string): Promise<FilmDetails | null> {
    const cacheKey = `film:${id}`;

    try {
      if (!redis.isOpen) {
        await redis.connect().catch(err => {
            console.error('Failed to connect to Redis for getFilmDetails:', err);
        });
      }

      if (redis.isOpen) {
        const cachedFilm = await redis.get(cacheKey);
        if (cachedFilm) {
            console.log(`CACHE HIT for film: ${id}`);
            return JSON.parse(cachedFilm);
        }
      }
    } catch (error) {
        console.error("Redis GET error in getFilmDetails:", error);
    }

    console.log(`CACHE MISS for film: ${id}. Fetching from TMDB.`);
    const filmDetails = await getFilmDetailsFromTMDB(id);
    
    if (!filmDetails) {
        return null;
    }

    try {
        if (redis.isOpen) {
            await redis.set(cacheKey, JSON.stringify(filmDetails), {
                EX: CACHE_EXPIRATION_SECONDS
            });
        }
    } catch (error) {
        console.error("Redis SET error in getFilmDetails:", error);
    }
    
    return filmDetails;
}


export default async function FilmDetailPage({ params }: { params: { id: string } }) {
  const filmId = parseInt(params.id, 10);
  if (isNaN(filmId)) {
    notFound();
  }
  
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { 
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      } 
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const authUser = session?.user;

  const film = await getFilmDetails(params.id);

  if (!film) {
    notFound();
  }

  const isAlreadyInWatchlist = await getWatchlistStatusForFilm(filmId, authUser?.id ?? null);

  const posterUrl = film.poster_path ? `${IMAGE_BASE_URL}w500${film.poster_path}` : 'https://placehold.co/400x600.png';
  const year = film.release_date ? new Date(film.release_date).getFullYear() : 'N/A';
  const rating = film.vote_average ? film.vote_average / 2 : 0;

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg shadow-primary/10">
            <Image
              src={posterUrl}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-muted-foreground mt-2 text-sm sm:text-base">
              <span>{year}</span>
              {film.director && <span>Directed by <span className="text-foreground font-semibold">{film.director.name}</span></span>}
               {film.runtime && <span>{film.runtime} min</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
             {film.genres.map(genre => <Badge key={genre.id} variant="outline">{genre.name}</Badge>)}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-primary">
                <span className="sr-only">Average rating: {rating.toFixed(1)} out of 5 stars</span>
                {[...Array(Math.floor(rating))].map((_, i) => <Star key={`full-${i}`} aria-hidden="true" className="w-5 h-5 fill-current" />)}
                {rating % 1 >= 0.25 && rating % 1 < 0.75 && <Star key="half" aria-hidden="true" className="w-5 h-5 fill-current" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
                {[...Array(5-Math.ceil(rating))].map((_, i) => <Star key={`empty-${i}`} aria-hidden="true" className="w-5 h-5" />)}
            </div>
            <span className="font-bold text-lg text-foreground">{film.vote_average ? film.vote_average.toFixed(1) : 'N/A'} / 10</span>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4">
            <LogFilmDialog film={film}>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Log Film
              </Button>
            </LogFilmDialog>
            <WatchlistButton filmId={filmId} initialIsInWatchlist={isAlreadyInWatchlist} />
          </div>
          <Separator className="my-6 !mt-8" />
          <div>
            <h2 className="text-2xl font-headline font-semibold">Plot Summary</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed max-w-prose">{film.overview || 'No summary available.'}</p>
          </div>
           <div>
            <h2 className="text-2xl font-headline font-semibold">Cast</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
              {film.cast.map((actor) => (
                <div key={actor.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                    {actor.profile_path ? (
                       <Image
                          src={`${IMAGE_BASE_URL}w185${actor.profile_path}`}
                          alt={actor.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <FilmIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                   <div>
                    <p className="font-semibold text-sm">{actor.name}</p>
                    <p className="text-xs text-muted-foreground">{actor.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
