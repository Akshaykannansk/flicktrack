
'use client';

import { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';
import { AddToListButton } from './add-to-list-button';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function FilmCard({ film, isInWatchlist, isLiked }: FilmCardProps) {
  const posterUrl = film.poster_path ? `${IMAGE_BASE_URL}w500${film.poster_path}` : 'https://placehold.co/400x600.png';
  const year = film.release_date ? new Date(film.release_date).getFullYear() : 'N/A';
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session }}) => {
        setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);


  return (
    <div className="group relative">
        <Card className="overflow-hidden bg-secondary border-2 border-transparent group-hover:border-primary/50 transition-all duration-300">
          <CardContent className="p-0 relative">
             <Link href={`/film/${film.id}`} className="block">
                <div className="aspect-[2/3] relative">
                  <Image
                    src={posterUrl}
                    alt={`Poster for ${film.title}`}
                    fill
                    className="object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                    data-ai-hint={`${film.title} movie poster`}
                  />
                </div>
            </Link>
            {user && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                        <LogFilmDialog film={film}>
                            <Button variant="outline" size="sm" className="w-32">
                                <BookPlus className="mr-2 h-4 w-4" /> Log
                            </Button>
                        </LogFilmDialog>
                        <WatchlistAction filmId={parseInt(film.id, 10)} initialIsInWatchlist={!!isInWatchlist} />
                        <LikeAction filmId={parseInt(film.id, 10)} initialIsLiked={!!isLiked} />
                        <AddToListButton filmId={parseInt(film.id, 10)} />
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
      <div className="mt-2">
         <Link href={`/film/${film.id}`}>
           <h3 className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors">{film.title}</h3>
         </Link>
         <p className="text-xs text-muted-foreground">{year}</p>
      </div>
    </div>
  );
}
