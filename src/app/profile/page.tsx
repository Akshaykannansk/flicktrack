import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Film as FilmIcon, UserPlus, UserCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FilmCard } from '@/components/film-card';
import type { Film as FilmType } from '@/lib/types';
import { currentUser, User } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getFilmDetails } from '@/lib/tmdb';
import { FollowButton } from './follow-button';

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

    return { journalCount, followersCount, followingCount, favoriteFilms: validFavoriteFilms };
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
    const { journalCount, followersCount, followingCount, favoriteFilms } = stats;

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
                <div className="flex justify-center md:justify-start space-x-4 text-sm text-muted-foreground mt-3">
                    <span><strong className="text-primary-foreground">{journalCount}</strong> Films</span>
                    <span><strong className="text-primary-foreground">{followersCount}</strong> Followers</span>
                    <span><strong className="text-primary-foreground">{followingCount}</strong> Following</span>
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
                    {favoriteFilms.map((film) => (
                    <FilmCard key={film.id} film={film} />
                    ))}
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
                <Card>
                    <CardContent className="p-6">
                        <p className="text-muted-foreground">This user's recent journal entries will appear here. (Coming soon!)</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
