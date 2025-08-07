

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Film as FilmIcon, Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FilmCard } from '@/components/film-card';
import type { Film as FilmType, LoggedFilm } from '@/lib/types';
import { currentUser, User } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getFilmDetails } from '@/lib/tmdb';
import { FollowButton } from './follow-button';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';

async function getUserStats(userId: string) {
    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            favoriteFilms: true,
            _count: {
                select: {
                    followers: true,
                    following: true,
                    journalEntries: true
                }
            }
        }
    });

    if (!dbUser) return null;

    const journalCount = dbUser._count.journalEntries;
    const followersCount = dbUser._count.followers;
    const followingCount = dbUser._count.following;

    const favoriteFilmsDetails = await Promise.all(
        dbUser.favoriteFilms.map(film => getFilmDetails(film.id.toString()))
    );

    const validFavoriteFilms = favoriteFilmsDetails.filter(Boolean) as FilmType[];
    
    const watchlist = await prisma.watchlistItem.findMany({
        where: { userId },
        select: { filmId: true }
    });
    const watchlistIds = new Set(watchlist.map(item => item.filmId));


    const recentJournalEntries = await prisma.journalEntry.findMany({
        where: { userId },
        take: 10,
        orderBy: { loggedDate: 'desc' },
        include: { film: true }
    });

    return { 
        journalCount, 
        followersCount, 
        followingCount, 
        favoriteFilms: validFavoriteFilms,
        watchlistIds,
        recentJournalEntries: recentJournalEntries.map(entry => ({
            id: entry.id,
            film: {
                id: entry.film.id.toString(),
                title: entry.film.title,
                poster_path: entry.film.posterPath,
                release_date: entry.film.releaseDate,
                vote_average: entry.film.voteAverage,
                overview: entry.film.overview,
            },
            rating: entry.rating,
            review: entry.review || undefined,
            loggedDate: entry.loggedDate.toISOString()
        }))
    };
}


export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Upsert user in DB on their own profile visit
   await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
            id: user.id,
            email: user.emailAddresses[0].emailAddress,
            name: user.fullName,
        }
    });

  const stats = await getUserStats(user.id);
  
  if (!stats) {
    notFound();
  }
  
  return <ProfilePageContent user={user} stats={stats} isCurrentUser={true} />;
}


interface ProfilePageContentProps {
    user: User,
    stats: NonNullable<Awaited<ReturnType<typeof getUserStats>>>,
    isCurrentUser: boolean,
    isFollowing?: boolean,
}

export function ProfilePageContent({ user, stats, isCurrentUser, isFollowing }: ProfilePageContentProps) {
    const { journalCount, followersCount, followingCount, favoriteFilms, recentJournalEntries, watchlistIds } = stats;
    const favoriteFilmIds = new Set(favoriteFilms.map(f => parseInt(f.id, 10)));

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
                <div className="flex justify-center md:justify-start space-x-6 text-base text-muted-foreground mt-3">
                    <span><strong className="text-primary-foreground font-semibold">{journalCount}</strong> Films</span>
                    <span><strong className="text-primary-foreground font-semibold">{followersCount}</strong> Followers</span>
                    <span><strong className="text-primary-foreground font-semibold">{followingCount}</strong> Following</span>
                </div>
                <div className="flex justify-center md:justify-start gap-2 mt-4">
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
                                isFavorite={favoriteFilmIds.has(filmId)}
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

