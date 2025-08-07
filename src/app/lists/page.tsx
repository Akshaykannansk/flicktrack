
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { List, Loader2, PlusCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import { Button } from '@/components/ui/button';
import { CreateListDialog } from '@/components/create-list-dialog';
import type { FilmListSummary } from '@/lib/types';


export default function ListsPage() {
  const [lists, setLists] = useState<FilmListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = async () => {
      try {
        const response = await fetch('/api/lists');
        if (!response.ok) {
          throw new Error('Failed to fetch lists.');
        }
        const data = await response.json();
        setLists(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

  useEffect(() => {
    fetchLists();
  }, []);

  const onListCreated = () => {
    // Refetch lists after a new one is created
    setIsLoading(true);
    fetchLists();
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <List className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-headline font-bold tracking-tighter">My Lists</h1>
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
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
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <List className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-headline font-bold tracking-tighter">My Lists</h1>
        </div>
        <CreateListDialog onListCreated={onListCreated}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create List
            </Button>
        </CreateListDialog>
      </div>

      {lists.length > 0 ? (
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
                  <p className="text-sm text-muted-foreground mt-1">{list._count.films} {list._count.films === 1 ? 'film' : 'films'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">You haven't created any lists yet.</h2>
          <p className="text-muted-foreground mt-2">Create lists to organize films by theme, mood, or anything you like.</p>
        </div>
      )}
    </div>
  );
}
