import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Settings, Film } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FilmCard } from '@/components/film-card';
import type { Film as FilmType } from '@/lib/types';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

async function getUserStats(userId: string) {
    const journalCount = await prisma.journalEntry.count({ where: { userId } });
    const watchlistCount = await prisma.watchlistItem.count({ where: { userId } });
    
    // NOTE: Favorite films are not implemented in the schema yet.
    // This is a placeholder.
    const favoriteFilms = await prisma.film.findMany({
        take: 4,
        orderBy: {
            voteAverage: 'desc'
        }
    });

    return { journalCount, watchlistCount, favoriteFilms };
}


export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) {
    // This should not happen due to middleware, but it's good practice
    return <div>Not logged in</div>;
  }

  const { journalCount, watchlistCount, favoriteFilms } = await getUserStats(user.id);
  const favoriteFilmsTyped: FilmType[] = favoriteFilms.map(f => ({
      ...f,
      id: f.id.toString(),
      poster_path: f.posterPath,
      release_date: f.releaseDate ? f.releaseDate.toISOString() : null,
      vote_average: f.voteAverage
  }));

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
             <span><strong className="text-primary-foreground">{watchlistCount}</strong> on Watchlist</span>
          </div>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/user-profile">
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
            </Link>
          </Button>
        </div>
      </div>
      
      <Separator />

      <div>
        <h2 className="text-2xl font-headline font-semibold mb-4">Favorite Films</h2>
        {favoriteFilms.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            {favoriteFilmsTyped.map((film) => (
               <FilmCard key={film.id} film={film} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold">No favorite films selected.</h3>
            <p className="text-muted-foreground mt-1">Edit your profile to add your top 4.</p>
          </div>
        )}
      </div>

       <div>
        <h2 className="text-2xl font-headline font-semibold mb-4">Recent Activity</h2>
        <Card>
            <CardContent className="p-6">
                <p className="text-muted-foreground">Your recent journal entries will appear here. (Coming soon!)</p>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
