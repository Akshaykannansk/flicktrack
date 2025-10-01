
import { searchFilms } from '@/lib/tmdb-server';
import { searchUsers } from '@/services/userService';
import { FilmCard } from '@/components/film-card';
import { Search, Clapperboard, Users, List, MessageSquareText } from 'lucide-react';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserFilmSets } from '@/services/userService';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PublicUser, FilmListSearchResult, ReviewSearchResult } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { searchLists } from '@/services/listService';
import { searchReviews } from '@/services/reviewService';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import { Star } from 'lucide-react';

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

const ListResultsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-full flex flex-col bg-secondary border-transparent">
                <CardContent className="p-4 flex-grow">
                    <Skeleton className="aspect-video rounded-md mb-4" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                </CardContent>
            </Card>
        ))}
    </div>
);

const ReviewResultsSkeleton = () => (
    <div className="space-y-4">
         {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-secondary/50 border-0 overflow-hidden">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className='space-y-1'>
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        ))}
    </div>
);


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

async function ListResults({ query }: { query: string }) {
    const lists = await searchLists(query) as FilmListSearchResult[];

    if (lists.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold">No lists found for "{query}"</h2>
                <p className="text-muted-foreground mt-2">Try a different search term.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
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
                     <p className="text-sm text-muted-foreground mt-1">by {list.user.name}</p>
                     <p className="text-sm text-muted-foreground mt-1">{list._count.films} {list._count.films === 1 ? 'film' : 'films'}</p>
                    </CardContent>
                </Card>
                </Link>
            ))}
            </div>
    )
}

async function ReviewResults({ query }: { query: string }) {
    const reviews = await searchReviews(query) as ReviewSearchResult[];
    
    if (reviews.length === 0) {
         return (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold">No reviews found for "{query}"</h2>
                <p className="text-muted-foreground mt-2">Try a different search term.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
             {reviews.map((entry) => (
                 <Link key={entry.id} href={`/review/${entry.id}`} className="block">
                    <Card className="bg-secondary/50 border-0 overflow-hidden hover:bg-secondary/80 transition-colors">
                        <CardHeader>
                             <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={entry.user.imageUrl || undefined} alt={entry.user.name || 'avatar'} />
                                    <AvatarFallback>{entry.user.name?.charAt(0) ?? 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{entry.user.name}</p>
                                    <p className="text-sm text-muted-foreground">Reviewed {entry.film.title}</p>
                                </div>
                             </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <div className="flex items-center">
                                {[...Array(Math.floor(entry.rating))].map((_, i) => <Star key={`full-${i}`} className="w-4 h-4 text-accent fill-accent" />)}
                                {entry.rating % 1 !== 0 && <Star key='half' className="w-4 h-4 text-accent fill-accent" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
                                {[...Array(5-Math.ceil(entry.rating))].map((_, i) => <Star key={`empty-${i}`} className="w-4 h-4 text-accent" />)}
                            </div>
                            <blockquote className="pl-4 border-l-2 text-muted-foreground italic">"{entry.review}"</blockquote>
                        </CardContent>
                    </Card>
                 </Link>
          ))}
        </div>
    )
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

    const searchTypes = [
        { name: 'films', icon: Clapperboard, label: 'Films' },
        { name: 'profiles', icon: Users, label: 'Profiles' },
        { name: 'lists', icon: List, label: 'Lists' },
        { name: 'reviews', icon: MessageSquareText, label: 'Reviews' },
    ];

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
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl">
                         {searchTypes.map((searchType) => (
                             <TabsTrigger value={searchType.name} asChild key={searchType.name}>
                                <Link href={`/search?q=${encodeURIComponent(query)}&type=${searchType.name}`}>
                                    <searchType.icon className="mr-2" /> {searchType.label}
                                </Link>
                             </TabsTrigger>
                         ))}
                    </TabsList>
                    <TabsContent value="films" className="mt-6">
                         <Suspense fallback={<FilmResultsSkeleton />}>
                            <FilmResults query={query} userId={user?.id ?? null} />
                        </Suspense>
                    </TabsContent>
                    <TabsContent value="profiles" className="mt-6">
                        <Suspense fallback={<UserResultsSkeleton />}>
                            <UserResults query={query} />
                        </Suspense>
                    </TabsContent>
                    <TabsContent value="lists" className="mt-6">
                        <Suspense fallback={<ListResultsSkeleton />}>
                            <ListResults query={query} />
                        </Suspense>
                    </TabsContent>
                    <TabsContent value="reviews" className="mt-6">
                        <Suspense fallback={<ReviewResultsSkeleton />}>
                            <ReviewResults query={query} />
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
