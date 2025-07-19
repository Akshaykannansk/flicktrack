import { userData } from '@/lib/data';
import { FilmCard } from '@/components/film-card';
import { Bookmark } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Film } from '@/lib/types';

export default function WatchlistPage() {
  const watchlist = userData.watchlist;

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Bookmark className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-headline font-bold tracking-tighter">My Watchlist</h1>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {watchlist.map((film) => (
            <FilmCard key={film.id} film={film as Film} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg flex flex-col items-center">
          <h2 className="text-xl font-semibold">Your watchlist is empty.</h2>
          <p className="text-muted-foreground mt-2">Browse films and add them to your watchlist.</p>
          <Button asChild className="mt-6">
            <Link href="/">Browse Films</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
