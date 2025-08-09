
'use client';

import { useEffect, useState } from 'react';
import { FilmCard } from '@/components/film-card';
import { Bookmark } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Film as FilmType } from '@/lib/types';
import { Prisma } from '@prisma/client';

type WatchlistItem = {
  film: FilmType & { id: string }
}

interface UserFilmSets {
    watchlistIds: Set<number>;
    likedIds: Set<number>;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [userFilmSets, setUserFilmSets] = useState<UserFilmSets>({ watchlistIds: new Set(), likedIds: new Set() });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWatchlistData() {
        setIsLoading(true);
        try {
            const [watchlistRes, likesRes] = await Promise.all([
                fetch('/api/watchlist'),
                fetch('/api/films/likes')
            ]);

            if (!watchlistRes.ok) {
                throw new Error('Failed to fetch watchlist.');
            }
            const watchlistData: WatchlistItem[] = await watchlistRes.json();
            setWatchlist(watchlistData);
            
            const watchlistIds = new Set(watchlistData.map(item => parseInt(item.film.id, 10)));
            
            let likedIds = new Set<number>();
            if (likesRes.ok) {
                const likesData: { film: FilmType }[] = await likesRes.json();
                likedIds = new Set(likesData.map(item => parseInt(item.film.id, 10)));
            }

            setUserFilmSets({ watchlistIds, likedIds });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }
    fetchWatchlistData();
  }, []);

  if (isLoading) {
    return (
       <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <Bookmark className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-headline font-bold tracking-tighter">My Watchlist</h1>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
             <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
     return <div className="text-center py-20 text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Bookmark className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-headline font-bold tracking-tighter">My Watchlist</h1>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {watchlist.map(({ film }) => {
              const filmId = parseInt(film.id, 10);
              return (
                 <FilmCard 
                    key={film.id} 
                    film={film} 
                    isInWatchlist={userFilmSets.watchlistIds.has(filmId)}
                    isLiked={userFilmSets.likedIds.has(filmId)}
                />
              )
          })}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg flex flex-col items-center">
          <h2 className="text-xl font-semibold">Your watchlist is empty.</h2>
          <p className="text-muted-foreground mt-2">Browse films and add them to your watchlist.</p>
          <Button asChild className="mt-6">
            <Link href="/">Browse Films</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
