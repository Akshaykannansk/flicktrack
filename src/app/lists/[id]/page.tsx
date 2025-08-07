
'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { FilmCard } from '@/components/film-card';
import { Button } from '@/components/ui/button';
import { List, Loader2, Trash2, Edit } from 'lucide-react';
import type { Film as FilmType, FilmList as FilmListType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LikeListButton } from '@/components/like-list-button';
import { CopyListButton } from '@/components/copy-list-button';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';


interface UserFilmSets {
    watchlistIds: Set<number>;
    likedIds: Set<number>;
    likedListIds: Set<string>;
}

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const [list, setList] = useState<FilmListType | null>(null);
  const [userFilmSets, setUserFilmSets] = useState<UserFilmSets>({ watchlistIds: new Set(), likedIds: new Set(), likedListIds: new Set() });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
    }
    getUser();
  }, [supabase.auth]);

  const fetchListData = async () => {
    if (!params.id) return;
    setIsLoading(true);

    try {
        // Fetch list details
        const listResponse = await fetch(`/api/lists/${params.id}`);
        if (listResponse.status === 404) {
            notFound();
            return;
        }
        if (!listResponse.ok) {
            throw new Error('Failed to fetch list details.');
        }
        const listData: FilmListType = await listResponse.json();
        setList(listData);

        // Fetch user's watchlist and likes if logged in
        if (user) {
            const [watchlistRes, likesRes, likedListsRes] = await Promise.all([
                fetch('/api/watchlist'),
                fetch('/api/films/likes'),
                fetch('/api/lists/likes')
            ]);

            let watchlistIds = new Set<number>();
            if (watchlistRes.ok) {
                const watchlistData: { film: FilmType }[] = await watchlistRes.json();
                watchlistIds = new Set(watchlistData.map(item => parseInt(item.film.id, 10)));
            }

            let likedIds = new Set<number>();
            if (likesRes.ok) {
                const likesData: { film: FilmType }[] = await likesRes.json();
                likedIds = new Set(likesData.map(item => parseInt(item.film.id, 10)));
            }
            
            let likedListIds = new Set<string>();
            if (likedListsRes.ok) {
                const likedListsData: { listId: string }[] = await likedListsRes.json();
                likedListIds = new Set(likedListsData.map(item => item.listId));
            }

            setUserFilmSets({ watchlistIds, likedIds, likedListIds });
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }
  
  useEffect(() => {
    fetchListData();
  }, [params.id, user]);
  
  const handleDeleteList = async () => {
    setIsDeleting(true);
    try {
        const response = await fetch(`/api/lists/${params.id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('Failed to delete the list.');
        }
        toast({
            title: 'List Deleted',
            description: `The list "${list?.name}" has been successfully deleted.`,
        });
        router.push('/lists');
        router.refresh();
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: error.message,
        });
    } finally {
        setIsDeleting(false);
    }
  }

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
    return notFound();
  }

  const isOwner = user?.id === list.userId;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start flex-col">
              <div className="flex items-center space-x-3">
                <List className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-headline font-bold tracking-tighter">{list.name}</h1>
              </div>
               <p className="text-muted-foreground mt-2">
                    Created by <Link href={`/profile/${list.user.id}`} className="text-primary hover:underline">{list.user.name}</Link>
                </p>
            </div>
            {isOwner ? (
                <div className="flex items-center gap-2">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" size="icon" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                <span className="sr-only">Delete List</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your list "{list.name}".
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteList} className="bg-destructive hover:bg-destructive/90">
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ) : user && (
               <div className="flex items-center gap-2">
                  <LikeListButton listId={list.id} initialIsLiked={userFilmSets.likedListIds.has(list.id)} onLikeToggled={fetchListData} />
                  <CopyListButton listId={list.id} />
               </div>
            )}
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl">{list.description}</p>
        <p className="text-sm text-muted-foreground mt-2">
            {list.films.length} {list.films.length === 1 ? 'film' : 'films'} &bull; {list._count.likedBy} {list._count.likedBy === 1 ? 'like' : 'likes'}
        </p>
      </div>

      {list.films.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {list.films.map(({ film }) => {
              if (!film) return null;
              const filmId = parseInt(film.id, 10);
              return (
                <FilmCard 
                    key={film.id} 
                    film={film} 
                    isInWatchlist={userFilmSets.watchlistIds.has(filmId)}
                    isLiked={userFilmSets.likedIds.has(filmId)}
                />
              )
          })}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">This list is empty.</h2>
           {isOwner ? (
                <div className="space-y-4 mt-2">
                    <p className="text-muted-foreground">Add films to this list to see them here.</p>
                     <Button asChild>
                        <Link href="/">Browse Films</Link>
                    </Button>
                </div>
           ) : (
                <p className="text-muted-foreground mt-2">Check back later to see what films get added.</p>
           )}
        </div>
      )}
    </div>
  );
}
