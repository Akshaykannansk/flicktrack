'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { FilmCard } from '@/components/film-card';
import { List, Loader2 } from 'lucide-react';
import type { Film as FilmType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface ListWithFilms {
    id: string;
    name: string;
    description: string;
    films: { film: FilmType }[];
}

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const [list, setList] = useState<ListWithFilms | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListDetails() {
      if (!params.id) return;
      try {
        const response = await fetch(`/api/lists/${params.id}`);
        if (response.status === 404) {
          notFound();
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch list details.');
        }
        const data = await response.json();
        setList(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchListDetails();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center space-x-3">
            <List className="w-8 h-8 text-primary" />
            <Skeleton className="h-10 w-1/2" />
          </div>
          <Skeleton className="h-5 w-3/4 mt-2" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-destructive">{error}</div>;
  }
  
  if (!list) {
    // This handles the case where loading is done, but the list is still null (e.g. API error handled gracefully)
    // The notFound() call inside useEffect should handle 404s.
    return notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center space-x-3">
          <List className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-headline font-bold tracking-tighter">{list.name}</h1>
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl">{list.description}</p>
        <p className="text-sm text-muted-foreground mt-2">{list.films.length} {list.films.length === 1 ? 'film' : 'films'}</p>
      </div>

      {list.films.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {list.films.map(({ film }) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">This list is empty.</h2>
          <p className="text-muted-foreground mt-2">Add films to this list to see them here.</p>
        </div>
      )}
    </div>
  );
}
