
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquare, User, Users } from 'lucide-react';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import type { Film, PublicUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from './ui/button';
import { LikeReviewButton } from './like-review-button';
import { Comments } from './comments';
import { useEffect, useState } from 'react';
import type { User as AuthUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface FeedEntry {
  id: string;
  film: Film;
  user: PublicUser;
  rating: number;
  review: string | null;
  logged_date: string;
  reviewLikes: { userId: string }[];
  _count: {
    reviewLikes: number;
    comments: number;
  }
}

export const FeedSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-secondary border-0">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className='space-y-1'>
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Skeleton className="w-24 h-36 rounded-md" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
)

export function FollowingFeed() {
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  
  useEffect(() => {
    const supabase = createClient();
    const fetchUserAndFeed = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser ?? null);
        
        if (authUser) {
            try {
                const response = await fetch('/api/feed');
                if (response.ok) {
                    const data = await response.json();
                    setFeed(data);
                } else {
                    console.error("Failed to fetch feed");
                }
            } catch (error) {
                 console.error("Error fetching feed:", error);
            }
        }
        setIsLoading(false);
    }
    fetchUserAndFeed();
  }, []);
  
  if (isLoading) {
    return <FeedSkeleton />;
  }
  
  if (feed.length === 0) {
    return (
       <div className="text-center py-20 border-2 border-dashed rounded-lg flex flex-col items-center bg-secondary/30">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Your Feed is Empty</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Follow other users to see their recent film logs and reviews here.
          </p>
           <Button asChild className="mt-6">
            <Link href="/search">Find Users to Follow</Link>
          </Button>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      {feed.map((entry) => {
          const posterUrl = entry.film.poster_path ? `${IMAGE_BASE_URL}w500${entry.film.poster_path}` : 'https://placehold.co/400x600.png';
          return (
            <Card key={entry.id} className="bg-secondary/50 border-0 overflow-hidden">
                <CardHeader>
                    <div className="flex items-center gap-3">
                         <Link href={`/profile/${entry.user.id}`}>
                            <Image src={entry.user.imageUrl || 'https://placehold.co/40x40.png'} alt={entry.user.name || 'avatar'} width={40} height={40} className="rounded-full" />
                         </Link>
                         <div>
                            <p className="text-sm font-semibold text-foreground">
                                <Link href={`/profile/${entry.user.id}`} className="hover:text-primary transition-colors">{entry.user.name}</Link>
                                <span className="text-muted-foreground font-normal ml-1.5">logged a film</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(entry.logged_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </p>
                         </div>
                    </div>
                </CardHeader>
                <CardContent className="flex gap-4">
                     <div className="w-24 flex-shrink-0">
                       <Link href={`/film/${entry.film.id}`}>
                        <Image
                          src={posterUrl}
                          alt={`Poster for ${entry.film.title}`}
                          width={200}
                          height={300}
                          className="rounded-md object-cover w-full aspect-[2/3]"
                          data-ai-hint={`${entry.film.title} poster`}
                        />
                        </Link>
                    </div>
                    <div className="flex-1">
                        <Link href={`/film/${entry.film.id}`} className="hover:text-primary transition-colors">
                            <h3 className="font-headline text-xl font-semibold">{entry.film.title}</h3>
                        </Link>
                        <div className="flex items-center my-2">
                            {[...Array(Math.floor(entry.rating))].map((_, i) => <Star key={`full-${i}`} className="w-4 h-4 text-accent fill-accent" />)}
                            {entry.rating % 1 !== 0 && <Star key='half' className="w-4 h-4 text-accent fill-accent" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
                            {[...Array(5-Math.ceil(entry.rating))].map((_, i) => <Star key={`empty-${i}`} className="w-4 h-4 text-accent" />)}
                        </div>
                        {entry.review && (
                             <blockquote className="mt-2 pl-4 border-l-2 border-border italic text-muted-foreground text-sm flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>"{entry.review}"</p>
                             </blockquote>
                        )}
                    </div>
                </CardContent>
                 {entry.review && user && (
                   <CardFooter className="flex-col items-start gap-4">
                        <div className="flex items-center gap-2">
                            {entry.user.id !== user.id && (
                                <LikeReviewButton 
                                    journalEntryId={entry.id}
                                    initialIsLiked={!!entry.reviewLikes.length}
                                    initialLikeCount={entry._count.reviewLikes}
                                />
                            )}
                             <Comments 
                                journalEntryId={entry.id}
                                initialCommentCount={entry._count.comments}
                            />
                        </div>
                   </CardFooter>
                )}
            </Card>
          )
      })}
    </div>
  );
}
