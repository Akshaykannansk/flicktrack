
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Film as FilmIcon, Star, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FilmCard } from '@/components/film-card';
import type { Film as FilmType } from '@/lib/types';
import { currentUser } from '@clerk/nextjs/server';
import type { User } from '@clerk/nextjs/api';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { getFilmDetails as getFilmDetailsFromTMDB } from '@/lib/tmdb';
import { FollowButton } from './follow-button';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import type { FilmDetails } from '@/lib/types';
import redis from '@/lib/redis';

const CACHE_EXPIRATION_SECONDS = 60 * 60 * 24; // 24 hours

async function getFilmDetails(id: string): Promise<FilmDetails | null> {
    const cacheKey = `film:${id}`;

    try {
      if (!redis.isOpen) {
        await redis.connect().catch(err => {
            console.error('Failed to connect to Redis for getFilmDetails:', err);
        });
      }

      if (redis.isOpen) {
        const cachedFilm = await redis.get(cacheKey);
        if (cachedFilm) {
            console.log(`CACHE HIT for film: ${id}`);
            return JSON.parse(cachedFilm);
        }
      }
    } catch (error) {
        console.error("Redis GET error in getFilmDetails:", error);
    }

    console.log(`CACHE MISS for film: ${id}. Fetching from TMDB.`);
    const filmDetails = await getFilmDetailsFromTMDB(id);
    
    if (!filmDetails) {
        return null;
    }

    try {
        if (redis.isOpen) {
            await redis.set(cacheKey, JSON.stringify(filmDetails), {
                EX: CACHE_EXPIRATION_SECONDS
            });
        }
    } catch (error) {
        console.error("Redis SET error in getFilmDetails:", error);
    }
    
    return filmDetails;
}


async function getUserStats(userId: string) {
    const supabase = createClient();
    
    const { data: dbUser, error } = await supabase
      .from('users')
      .select(`
        *,
        followers:follows!following_id(count),
        following:follows!follower_id(count),
        journal_entries(count),
        liked_films(count),
        liked_lists(count),
        favorite_films:favorite_films(films(*))
      `)
      .eq('id', userId)
      .single();

    if (error || !dbUser) {
        console.error("Error getting user stats from Supabase:", error);
        return null;
    }

    const journalCount = dbUser.journal_entries[0]?.count || 0;
    const followersCount = dbUser.followers[0]?.count || 0;
    const followingCount = dbUser.following[0]?.count || 0;
    const likesCount = (dbUser.liked_films[0]?.count || 0) + (dbUser.liked_lists[0]?.count || 0);
    const favoriteFilms = dbUser.favorite_films.map(fav => fav.films) as FilmType[];
    
    const [watchlistRes, likesRes, recentJournalRes] = await Promise.all([
      supabase.from('watchlist_items').select('film_id').eq('user_id', userId),
      supabase.from('liked_films').select('film_id').eq('user_id', userId),
      supabase.from('journal_entries').select('*, films(*)').eq('user_id', userId).order('logged_date', { ascending: false }).limit(10)
    ]);
    
    const watchlistIds = new Set(watchlistRes.data?.map(item => item.film_id));
    const likedIds = new Set(likesRes.data?.map(item => item.film_id));

    return { 
        journalCount, 
        followersCount, 
        followingCount,
        likesCount, 
        favoriteFilms,
        watchlistIds,
        likedIds,
        recentJournalEntries: recentJournalRes.data?.map(entry => ({
            id: entry.id,
            film: {
                ...entry.films,
                id: entry.films.id.toString(),
                poster_path: entry.films.poster_path,
            },
            rating: entry.rating,
            review: entry.review || undefined,
            loggedDate: entry.logged_date
        })) || []
    };
}


export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }
  const supabase = createClient();

   // Upsert user in DB on their own profile visit
   const { data: dbUser, error } = await supabase.from('users').upsert({
        id: user.id,
        email: user.emailAddresses[0].emailAddress,
        name: user.fullName,
        username: user.username,
        image_url: user.imageUrl,
        bio: (user.publicMetadata.bio as string) ?? null,
    }).select('bio').single();

  const stats = await getUserStats(user.id);
  
  if (!stats) {
    notFound();
  }

  const userWithBio = {
      ...user,
      bio: dbUser?.bio || null,
  }
  
  return <ProfilePageContent user={userWithBio} stats={stats} isCurrentUser={true} />;
}


interface ProfilePageContentProps {
    user: User & { bio: string | null },
    stats: NonNullable<Awaited<ReturnType<typeof getUserStats>>>,
    isCurrentUser: boolean,
    isFollowing?: boolean,
}

export function ProfilePageContent({ user, stats, isCurrentUser, isFollowing }: ProfilePageContentProps) {
    const { journalCount, followersCount, followingCount, likesCount, favoriteFilms, recentJournalEntries, watchlistIds, likedIds } = stats;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                <Image
                    src={user.imageUrl}
                    alt="User Avatar"
                    width={128}
                    height={128}
                    className="rounded-full border-4 border-primary shadow-lg"
                    data-ai-hint="profile avatar"
                />
                </div>
                <div className="text-center md:text-left">
                <h1 className="text-4xl font-headline font-bold tracking-tighter">{user.fullName || 'User'}</h1>
                <p className="text-muted-foreground mt-1">@{user.username || 'username'}</p>
                 {user.bio && <p className="text-foreground mt-3 max-w-xl">{user.bio}</p>}
                <div className="flex justify-center md:justify-start flex-wrap gap-x-6 gap-y-2 text-base text-muted-foreground mt-3">
                    <span><strong className="text-foreground font-semibold">{journalCount}</strong> Films</span>
                    <span><strong className="text-foreground font-semibold">{followersCount}</strong> Followers</span>
                    <span><strong className="text-foreground font-semibold">{followingCount}</strong> Following</span>
                    <Link href={isCurrentUser ? '/likes' : `/profile/${user.id}/likes`} className="hover:text-primary">
                        <strong className="text-foreground font-semibold">{likesCount}</strong> Likes
                    </Link>
                </div>
                <div className="flex justify-center md:justify-start flex-wrap gap-2 mt-4">
                    {isCurrentUser ? (
                        <>
                            <Button variant="outline" asChild>
                                <Link href="/user-profile">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/profile/edit">
                                    <FilmIcon className="mr-2 h-4 w-4" />
                                    Edit Favorites
                                </Link>
                            </Button>
                        </>
                    ) : (
                       <FollowButton userId={user.id} initialIsFollowing={isFollowing!} />
                    )}
                </div>
                </div>
            </div>
            
            <Separator />

            <div>
                <h2 className="text-2xl font-headline font-semibold mb-4">Favorite Films</h2>
                {favoriteFilms.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                    {favoriteFilms.map((film) => {
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
                ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">No favorite films selected.</h3>
                    {isCurrentUser && <p className="text-muted-foreground mt-1">Edit your profile to add your top 4.</p>}
                </div>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-headline font-semibold mb-4">Recent Activity</h2>
                {recentJournalEntries.length > 0 ? (
                    <div className="space-y-4">
                        {recentJournalEntries.map((entry) => {
                            const film = entry.film;
                            const posterUrl = film.poster_path ? `${IMAGE_BASE_URL}w500${film.poster_path}` : 'https://placehold.co/400x600.png';
                            const year = film.release_date ? new Date(film.release_date).getFullYear() : 'N/A';
                            
                            return (
                                <Card key={entry.id} className="bg-secondary border-0 md:flex overflow-hidden">
                                    <div className="md:w-32 flex-shrink-0 relative aspect-[2/3] md:aspect-auto">
                                        <Link href={`/film/${film.id}`} className="block h-full w-full">
                                            <Image
                                            src={posterUrl}
                                            alt={`Poster for ${film.title}`}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 8rem"
                                            data-ai-hint={`${film.title} poster`}
                                            />
                                        </Link>
                                    </div>
                                    <div className="flex flex-col flex-grow">
                                        <CardHeader>
                                            <CardTitle>
                                                <Link href={`/film/${film.id}`} className="hover:text-primary transition-colors">
                                                    <span className="font-headline text-xl">{film.title}</span>
                                                    <span className="text-muted-foreground font-normal text-base ml-2">({year})</span>
                                                </Link>
                                            </CardTitle>
                                            <div className="flex items-center pt-1">
                                                {[...Array(Math.floor(entry.rating))].map((_, i) => <Star key={`full-${i}`} className="w-4 h-4 text-accent fill-accent" />)}
                                                {entry.rating % 1 !== 0 && <Star key='half' className="w-4 h-4 text-accent fill-accent" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
                                                {[...Array(5-Math.ceil(entry.rating))].map((_, i) => <Star key={`empty-${i}`} className="w-4 h-4 text-accent" />)}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            {entry.review && <p className="text-muted-foreground text-sm italic leading-relaxed">"{entry.review}"</p>}
                                        </CardContent>
                                        <CardFooter>
                                            <p className="text-xs text-muted-foreground">Logged on {new Date(entry.loggedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </CardFooter>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                     <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                            <p>This user has no recent journal entries.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
