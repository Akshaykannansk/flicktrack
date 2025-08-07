
import { searchFilms, searchUsers } from '@/lib/tmdb';
import { FilmCard } from '@/components/film-card';
import { Search, User, Clapperboard } from 'lucide-react';
import type { Film, PublicUser } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure the page is re-rendered for each search

interface SearchPageProps {
    searchParams: {
        q?: string;
    };
}


async function getUserFilmSets(userId: string | null) {
    if (!userId) {
        return { watchlistIds: new Set<number>(), likedIds: new Set<number>() };
    }

    const [watchlist, likes] = await Promise.all([
        prisma.watchlistItem.findMany({
            where: { userId },
            select: { filmId: true }
        }),
        prisma.likedFilm.findMany({
            where: { userId },
            select: { filmId: true }
        })
    ]);

    const watchlistIds = new Set(watchlist.map(item => item.filmId));
    const likedIds = new Set(likes.map(item => item.filmId));

    return { watchlistIds, likedIds };
}


export default async function SearchPage({ searchParams }: SearchPageProps) {
    const query = searchParams.q || '';
    const { userId } = auth();
    
    let films: Film[] = [];
    let users: PublicUser[] = [];
    let watchlistIds = new Set<number>();
    let likedIds = new Set<number>();

    if (query) {
      const [filmResults, userResults, filmSets] = await Promise.all([
        searchFilms(query),
        searchUsers(query),
        getUserFilmSets(userId)
      ]);
      films = filmResults;
      users = userResults;
      watchlistIds = filmSets.watchlistIds;
      likedIds = filmSets.likedIds;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-3">
                <Search className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-headline font-bold tracking-tighter">
                    Search Results {query && `for "${query}"`}
                </h1>
            </div>

            {query ? (
                (films.length > 0 || users.length > 0) ? (
                    <div className="space-y-12">
                      {films.length > 0 && (
                        <section>
                           <div className="flex items-center gap-2 mb-4">
                            <Clapperboard className="w-6 h-6 text-primary/80" />
                            <h2 className="text-2xl font-headline font-semibold">Films</h2>
                           </div>
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                                {films.map((film) => {
                                    const filmId = parseInt(film.id, 10);
                                    return (
                                        <FilmCard 
                                            key={film.id} 
                                            film={film} 
                                            isInWatchlist={watchlistIds.has(filmId)}
                                            isLiked={likedIds.has(filmId)}
                                        />
                                    )
                                })}
                            </div>
                        </section>
                      )}

                       {users.length > 0 && (
                        <section>
                           <div className="flex items-center gap-2 mb-4">
                            <User className="w-6 h-6 text-primary/80" />
                            <h2 className="text-2xl font-headline font-semibold">Profiles</h2>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                               {users.map((user) => (
                                    <Link key={user.id} href={`/profile/${user.id}`}>
                                        <Card className="flex items-center gap-4 p-4 bg-secondary border-transparent hover:border-primary/50 transition-colors">
                                            <Image 
                                                src={user.imageUrl} 
                                                alt={user.name || 'User avatar'} 
                                                width={48} 
                                                height={48} 
                                                className="rounded-full"
                                            />
                                            <div>
                                                <p className="font-semibold">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                                            </div>
                                        </Card>
                                    </Link>
                               ))}
                           </div>
                        </section>
                      )}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <h2 className="text-xl font-semibold">No results found for "{query}"</h2>
                        <p className="text-muted-foreground mt-2">Try searching for something else.</p>
                    </div>
                )
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">Search for films or users</h2>
                    <p className="text-muted-foreground mt-2">Use the search bar in the header to find films and other FlickTrack users.</p>
                </div>
            )}
        </div>
    );
}
