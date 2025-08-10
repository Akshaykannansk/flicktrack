


import { searchFilms } from '@/lib/tmdb';
import { FilmCard } from '@/components/film-card';
import { Search, Clapperboard } from 'lucide-react';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserFilmSets } from '@/services/userService';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
    searchParams: {
        q?: string;
    };
}

const FilmResultsSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {[...Array(12)].map((_, i) => (
            <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        ))}
    </div>
);


async function SearchResults({ query, userId }: { query: string; userId: string | null }) {
    const [films, { watchlistIds, likedIds }] = await Promise.all([
        searchFilms(query),
        getUserFilmSets(userId)
    ]);

    return (
        films.length > 0 ? (
            <div className="space-y-12">
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
            </div>
        ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold">No results found for "{query}"</h2>
                <p className="text-muted-foreground mt-2">Try searching for something else.</p>
            </div>
        )
    );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const query = searchParams.q || '';
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              cookieStore.set({ name, value: '', ...options });
            },
          },
        }
    );
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-3">
                <Search className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-headline font-bold tracking-tighter">
                    Search Results {query && `for "${query}"`}
                </h1>
            </div>

            {query ? (
                <Suspense fallback={
                    <div className="space-y-12">
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Clapperboard className="w-6 h-6 text-primary/80" />
                                <h2 className="text-2xl font-headline font-semibold">Films</h2>
                            </div>
                           <FilmResultsSkeleton />
                        </section>
                    </div>
                }>
                    <SearchResults query={query} userId={user?.id ?? null} />
                </Suspense>
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">Search for films</h2>
                    <p className="text-muted-foreground mt-2">Use the search bar in the header to find films.</p>
                </div>
            )}
        </div>
    );
}
