
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Film as FilmIcon, Star, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FilmCard } from '@/components/film-card';
import type { Film as FilmType, PublicUser } from '@/lib/types';
import { notFound, redirect } from 'next/navigation';
import { FollowButton } from './follow-button';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserDataForProfile, getUserProfile } from '@/services/userService';

export default async function ProfilePage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/login");
  }

  const dbUser = await getUserProfile(user.id, ['id', 'bio', 'name', 'username', 'imageUrl']);

  if (!dbUser) {
    redirect('/login');
  }

  const stats = await getUserDataForProfile(user.id);
  
  if (!stats) {
    notFound();
  }
  
  return <ProfilePageContent user={dbUser as PublicUser} stats={stats.stats} isCurrentUser={true} />;
}


interface ProfilePageContentProps {
    user: PublicUser,
    stats: NonNullable<Awaited<ReturnType<typeof getUserDataForProfile>>>['stats'],
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
                    src={user.imageUrl || 'https://placehold.co/128x128.png'}
                    alt="User Avatar"
                    width={128}
                    height={128}
                    className="rounded-full border-4 border-primary shadow-lg"
                    data-ai-hint="profile avatar"
                />
                </div>
                <div className="text-center md:text-left">
                <h1 className="text-4xl font-headline font-bold tracking-tighter">{user.name || 'User'}</h1>
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
                                <Link href="/profile/edit">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Edit Profile
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
                                film={film as FilmType}
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
