import { userData } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IMAGE_BASE_URL } from '@/lib/tmdb';
import type { Film } from '@/lib/types';

export default function JournalPage() {
  const journal = userData.journal.sort((a, b) => new Date(b.loggedDate).getTime() - new Date(a.loggedDate).getTime());

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <BookOpen className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-headline font-bold tracking-tighter">My Journal</h1>
      </div>

      {journal.length > 0 ? (
        <div className="space-y-6">
          {journal.map((entry) => {
              const film = entry.film as Film; // Cast to new Film type
              const posterUrl = film.poster_path ? `${IMAGE_BASE_URL}w500${film.poster_path}` : 'https://placehold.co/400x600.png';
              const year = film.release_date ? new Date(film.release_date).getFullYear() : 'N/A';

              return (
                <Card key={film.id} className="bg-secondary border-0 md:flex overflow-hidden">
                    <div className="md:w-48 flex-shrink-0 relative aspect-[2/3] md:aspect-auto">
                       <Link href={`/film/${film.id}`} className="block h-full w-full">
                        <Image
                          src={posterUrl}
                          alt={`Poster for ${film.title}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 12rem"
                          data-ai-hint={`${film.title} poster`}
                        />
                        </Link>
                    </div>
                    <div className="flex flex-col flex-grow">
                        <CardHeader>
                            <CardTitle>
                              <Link href={`/film/${film.id}`} className="hover:text-primary transition-colors">
                                <span className="font-headline text-2xl">{film.title}</span>
                                <span className="text-muted-foreground font-normal text-lg ml-2">({year})</span>
                              </Link>
                            </CardTitle>
                            <div className="flex items-center pt-1">
                                {[...Array(Math.floor(entry.rating))].map((_, i) => <Star key={`full-${i}`} className="w-5 h-5 text-accent fill-accent" />)}
                                {entry.rating % 1 !== 0 && <Star key='half' className="w-5 h-5 text-accent fill-accent" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
                                {[...Array(5-Math.ceil(entry.rating))].map((_, i) => <Star key={`empty-${i}`} className="w-5 h-5 text-accent" />)}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            {entry.review && <p className="text-muted-foreground italic leading-relaxed">"{entry.review}"</p>}
                        </CardContent>
                        <CardFooter>
                            <p className="text-xs text-muted-foreground">Logged on {new Date(entry.loggedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </CardFooter>
                    </div>
                </Card>
              )
            }
          )}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg flex flex-col items-center">
          <h2 className="text-xl font-semibold">Your journal is empty.</h2>
          <p className="text-muted-foreground mt-2">Log films you've watched to see them here.</p>
           <Button asChild className="mt-6">
            <Link href="/">Browse Films</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
