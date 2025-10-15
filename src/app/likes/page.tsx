
'use client';

import { useEffect, useState } from 'react';
import { FilmCard } from '@/components/film-card';
import { Heart, List, Clapperboard, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Film as FilmType, FilmListSummary } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from '@/components/CustomImage';;
import { Card, CardContent } from '@/components/ui/card';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';

interface LikedFilmItem {
  film: FilmType;
}

interface UserFilmSets {
  watchlistIds: Set<number>;
  likedFilmIds: Set<number>;
}

export default function LikesPage() {
  const [likedFilms, setLikedFilms] = useState<LikedFilmItem[]>([]);
  const [likedLists, setLikedLists] =useState<FilmListSummary[]>([]);
  const [userFilmSets, setUserFilmSets] = useState<UserFilmSets>({ watchlistIds: new Set(), likedFilmIds: new Set() });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLikesData() {
        setIsLoading(true);
        try {
            const [likedFilmsRes, likedListsRes, watchlistRes] = await Promise.all([
                fetch('/api/films/likes'),
                fetch('/api/lists/liked'),
                fetch('/api/watchlist'),
            ]);

            if (!likedFilmsRes.ok || !likedListsRes.ok) {
                throw new Error('Failed to fetch liked items.');
            }
            
            const likedFilmsData: LikedFilmItem[] = await likedFilmsRes.json();
            const likedListsData: FilmListSummary[] = await likedListsRes.json();
            setLikedFilms(likedFilmsData);
            setLikedLists(likedListsData);
            
            const likedFilmIds = new Set(likedFilmsData.map(item => parseInt(item.film.id, 10)));
            
            let watchlistIds = new Set<number>();
            if (watchlistRes.ok) {
                const watchlistData: { film: FilmType }[] = await watchlistRes.json();
                watchlistIds = new Set(watchlistData.map(item => parseInt(item.film.id, 10)));
            }

            setUserFilmSets({ watchlistIds, likedFilmIds });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }
    fetchLikesData();
  }, []);

  if (isLoading) {
    return (
       <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <Heart className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-headline font-bold tracking-tighter">My Likes</h1>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-6">
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
        <Heart className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-headline font-bold tracking-tighter">My Likes</h1>
      </div>

       <Tabs defaultValue="films" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="films">
            <Clapperboard className="mr-2"/> Films ({likedFilms.length})
          </TabsTrigger>
          <TabsTrigger value="lists">
            <List className="mr-2"/> Lists ({likedLists.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="films" className="mt-6">
           {likedFilms.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-6">
                {likedFilms.map(({ film }) => {
                    const filmId = parseInt(film.id, 10);
                    return (
                        <FilmCard 
                            key={film.id} 
                            film={film} 
                            isInWatchlist={userFilmSets.watchlistIds.has(filmId)}
                            isLiked={userFilmSets.likedFilmIds.has(filmId)}
                        />
                    )
                })}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">You haven't liked any films yet.</h2>
                    <p className="text-muted-foreground mt-2">Like films to see them here.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="lists" className="mt-6">
            {likedLists.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {likedLists.map((list) => (
                        <Link key={list.id} href={`/lists/${list.id}`} className="group block">
                        <Card className="h-full flex flex-col bg-secondary border-transparent hover:border-primary/50 transition-colors duration-300">
                            <CardContent className="p-4 flex-grow">
                            <div className="relative aspect-video rounded-md overflow-hidden mb-4 bg-muted">
                                {list.films.length > 0 ? (
                                    <div className="absolute inset-0 grid grid-cols-2 gap-px">
                                    {list.films.slice(0, 4).map(({ film }, index) => (
                                        <div key={film.id} className="relative">
                                        {film.poster_path ? (
                                            <Image
                                                src={`${IMAGE_BASE_URL}w500${film.poster_path}`}
                                                alt=""
                                                fill
                                                className="object-cover"
                                                sizes="10vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-secondary"></div>
                                        )}
                                        </div>
                                    ))}
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <List className="w-10 h-10" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            </div>
                            <h2 className="text-xl font-headline font-semibold text-foreground group-hover:text-primary transition-colors">{list.name}</h2>
                            <p className="text-sm text-muted-foreground mt-1">{list._count.films} {list._count.films === 1 ? 'film' : 'films'}</p>
                            </CardContent>
                        </Card>
                        </Link>
                    ))}
                    </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">You haven't liked any lists yet.</h2>
                    <p className="text-muted-foreground mt-2">Like lists to see them here.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
