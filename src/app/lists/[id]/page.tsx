
'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { FilmCard } from '@/components/film-card';
import { List, Loader2 } from 'lucide-react';
import type { Film as FilmType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@clerk/nextjs';

interface ListWithFilms {
    id: string;
    name: string;
    description: string;
    films: { film: FilmType }[];
    userId: string;
}

interface UserFilmSets {
    watchlistIds: Set<number>;
    favoriteIds: Set<number>;
    likedIds: Set<number>;
}

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const [list, setList] = useState<ListWithFilms | null>(null);
  const [userFilmSets, setUserFilmSets] = useState<UserFilmSets>({ watchlistIds: new Set(), favoriteIds: new Set(), likedIds: new Set() });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    async function fetchListData() {
        if (!params.id) return;
        setIsLoading(true);

        try {
            // Fetch list details
            const listResponse = await fetch(`/api/lists/${params.id}`);
            if (listResponse.status === 404) {
                notFound();
                return;
            }
            if (!listResponse.ok) {
                throw new Error('Failed to fetch list details.');
            }
            const listData: ListWithFilms = await listResponse.json();
            setList(listData);

            // Fetch user's watchlist and favorites if logged in
            if (user) {
                const [watchlistRes, favoritesRes, likesRes] = await Promise.all([
                    fetch('/api/watchlist'),
                    fetch('/api/profile/favorites'),
                    fetch('/api/films/likes')
                ]);

                let watchlistIds = new Set<number>();
                if (watchlistRes.ok) {
                    const watchlistData: { film: FilmType }[] = await watchlistRes.json();
                    watchlistIds = new Set(watchlistData.map(item => parseInt(item.film.id, 10)));
                }

                let favoriteIds = new Set<number>();
                if (favoritesRes.ok) {
                    const favoritesData: FilmType[] = await favoritesRes.json();
                    favoriteIds = new Set(favoritesData.map(item => parseInt(item.id, 10)));
                }

                let likedIds = new Set<number>();
                if (likesRes.ok) {
                    const likesData: { film: FilmType }[] = await likesRes.json();
                    likedIds = new Set(likesData.map(item => parseInt(item.film.id, 10)));
                }

                setUserFilmSets({ watchlistIds, favoriteIds, likedIds });
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }
    fetchListData();
  }, [params.id, user]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center space-x-3">
            <List className="w-8 h-8 text-primary" />
            <Skeleton className="h-10 w-1/2" />
          </div>
          <Skeleton className="h-5 w-3/4 mt-2" />
          <Skeleton className="h-4 w-1/4 mt-2" />
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
    );
  }

  if (error) {
    return <div className="text-center py-20 text-destructive">{error}</div>;
  }
  
  if (!list) {
    return notFound();
  }

  const isOwner = user?.id === list.userId;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center space-x-3">
          <List className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-headline font-bold tracking-tighter">{list.name}</h1>
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl">{list.description}</p>
        <p className="text-sm text-muted-foreground mt-2">{list.films.length} {list.films.length === 1 ? 'film' : 'films'}</p>
      </div>

      {list.films.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {list.films.map(({ film }) => {
              const filmId = parseInt(film.id, 10);
              return (
                <FilmCard 
                    key={film.id} 
                    film={film} 
                    isInWatchlist={userFilmSets.watchlistIds.has(filmId)}
                    isFavorite={userFilmSets.favoriteIds.has(filmId)}
                    isLiked={userFilmSets.likedIds.has(filmId)}
                />
              )
          })}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">This list is empty.</h2>
           {isOwner && <p className="text-muted-foreground mt-2">Add films to this list to see them here.</p>}
        </div>
      )}
    </div>
  );
}
