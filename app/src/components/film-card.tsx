
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Film } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import { LogFilmDialog } from './log-film-dialog';
import { Button } from './ui/button';
import { BookPlus } from 'lucide-react';
import { WatchlistAction } from './watchlist-action';
import { LikeAction } from './like-action';
import { useUser } from '@clerk/nextjs';

interface FilmCardProps {
  film: Film;
  isInWatchlist?: boolean;
  isLiked?: boolean;
}

function SignInGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();

  if (!isSignedIn) {
    return (
      <Link href="/sign-in" className="w-full">
        {children}
      </Link>
    );
  }

  return <>{children}</>;
}


export function FilmCard({ film, isInWatchlist, isLiked }: FilmCardProps) {
  const posterUrl = film.poster_path ? `${IMAGE_BASE_URL}w500${film.poster_path}` : 'https://placehold.co/400x600.png';
  const year = film.release_date ? new Date(film.release_date).getFullYear() : 'N/A';

  return (
    <div className="group relative">
        <Card className="transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20 border-2 border-transparent group-hover:border-primary/50 rounded-lg bg-secondary">
          <CardContent className="p-0 relative">
             <Link href={`/film/${film.id}`} className="block">
                <div className="aspect-[2/3] relative rounded-md overflow-hidden">
                  <Image
                    src={posterUrl}
                    alt={`Poster for ${film.title}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                    data-ai-hint={`${film.title} movie poster`}
                  />
                </div>
            </Link>
             <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                    <SignInGuard>
                      <LogFilmDialog film={film}>
                          <Button variant="outline" size="sm" className="w-32">
                              <BookPlus className="mr-2 h-4 w-4" /> Log
                          </Button>
                      </LogFilmDialog>
                    </SignInGuard>
                    <SignInGuard>
                      <WatchlistAction filmId={parseInt(film.id, 10)} initialIsInWatchlist={!!isInWatchlist} />
                    </SignInGuard>
                     <SignInGuard>
                      <LikeAction filmId={parseInt(film.id, 10)} initialIsLiked={!!isLiked} />
                    </SignInGuard>
                </div>
              </div>
          </CardContent>
        </Card>
      <div className="mt-2">
         <Link href={`/film/${film.id}`}>
           <h3 className="font-semibold text-sm text-primary-foreground truncate hover:text-primary transition-colors">{film.title}</h3>
         </Link>
         <p className="text-xs text-muted-foreground">{year}</p>
      </div>
    </div>
  );
}
