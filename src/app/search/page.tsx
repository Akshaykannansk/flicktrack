
import { searchFilms } from '@/lib/tmdb';
import { searchUsers } from '@/services/userService';
import { FilmCard } from '@/components/film-card';
import { Search, Clapperboard, Users } from 'lucide-react';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserFilmSets } from '@/services/userService';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PublicUser } from '@/lib/types';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
    searchParams: {
        q?: string;
        type?: string;
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

const UserResultsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-secondary">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        ))}
    </div>
)

async function FilmResults({ query, userId }: { query: string; userId: string | null }) {
    const [films, { watchlistIds, likedIds }] = await Promise.all([
        searchFilms(query),
        getUserFilmSets(userId)
    ]);

    if (films.length === 0) {
         return (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold">No films found for "{query}"</h2>
                <p className="text-muted-foreground mt-2">Try searching for something else.</p>
            </div>
        )
    }

    return (
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
    );
}

async function UserResults({ query }: { query: string }) {
    const users = await searchUsers(query);
    
    if (users.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold">No users found for "{query}"</h2>
                <p className="text-muted-foreground mt-2">Try searching for something else.</p>
            </div>
        )
    }
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {users.map((user: PublicUser) => (
                <Link key={user.id} href={`/profile/${user.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={user.imageUrl || undefined} alt={user.name || 'avatar'} />
                            <AvatarFallback>{user.name?.charAt(0) ?? 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}


export default async function SearchPage({ searchParams }: SearchPageProps) {
    const query = searchParams.q || '';
    const type = searchParams.type || 'films';

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
                    Search {query && `for "${query}"`}
                </h1>
            </div>

            {query ? (
                <Tabs value={type} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="films" asChild>
                           <Link href={`/search?q=${encodeURIComponent(query)}&type=films`}><Clapperboard className="mr-2" /> Films</Link>
                        </TabsTrigger>
                        <TabsTrigger value="users" asChild>
                            <Link href={`/search?q=${encodeURIComponent(query)}&type=users`}><Users className="mr-2" /> Profiles</Link>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="films" className="mt-6">
                         <Suspense fallback={<FilmResultsSkeleton />}>
                            <FilmResults query={query} userId={user?.id ?? null} />
                        </Suspense>
                    </TabsContent>
                    <TabsContent value="users" className="mt-6">
                        <Suspense fallback={<UserResultsSkeleton />}>
                            <UserResults query={query} />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">Search for films or users</h2>
                    <p className="text-muted-foreground mt-2">Use the search bar in the header to find anything on FlickTrack.</p>
                </div>
            )}
        </div>
    );
}
