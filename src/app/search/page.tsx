
import { searchFilms } from '@/lib/tmdb';
import { FilmCard } from '@/components/film-card';
import { Search, User, Clapperboard } from 'lucide-react';
import type { Film, PublicUser } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserFilmSets, searchUsers } from '@/services/userService';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
    searchParams: {
        q?: string;
    };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const query = searchParams.q || '';
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    let films: Film[] = [];
    let users: PublicUser[] = [];
    let watchlistIds = new Set<number>();
    let likedIds = new Set<number>();

    if (query) {
      const [filmResults, userResults, filmSets] = await Promise.all([
        searchFilms(query),
        searchUsers(query),
        getUserFilmSets(user?.id ?? null)
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
                               {users.map((userResult) => (
                                    <Link key={userResult.id} href={`/profile/${userResult.id}`}>
                                        <Card className="flex items-center gap-4 p-4 bg-secondary border-transparent hover:border-primary/50 transition-colors">
                                            <Image 
                                                src={userResult.imageUrl || 'https://placehold.co/48x48.png'} 
                                                alt={userResult.name || 'User avatar'} 
                                                width={48} 
                                                height={48} 
                                                className="rounded-full"
                                            />
                                            <div>
                                                <p className="font-semibold">{userResult.name}</p>
                                                <p className="text-sm text-muted-foreground">@{userResult.username}</p>
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
