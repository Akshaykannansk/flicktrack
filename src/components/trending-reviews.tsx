'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import type { Film, PublicUser } from '@/lib/types';
import { CardDescription } from './ui/card';
import { LikeReviewButton } from './like-review-button';
import { Comments } from './comments';
import { useEffect, useState } from 'react';
import type { User as AuthUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { FeedSkeleton } from './following-feed';

interface TrendingReviewEntry {
  id: string;
  film: Film;
  user: PublicUser;
  rating: number;
  review: string | null;
  createdAt: string;
  reviewLikes: { userId: string }[];
  _count: {
    reviewLikes: number;
    comments: number;
  }
}

export function TrendingReviews() {
  const [reviews, setReviews] = useState<TrendingReviewEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  
  useEffect(() => {
    const supabase = createClient();
    const fetchUserAndReviews = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser ?? null);
        
        try {
            const response = await fetch('/api/trending-reviews');
            if (response.ok) {
                const data = await response.json();
                setReviews(data);
            } else {
                console.error("Failed to fetch trending reviews");
            }
        } catch (error) {
            console.error("Error fetching trending reviews:", error);
        }
        setIsLoading(false);
    }
    fetchUserAndReviews();
  }, []);

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (reviews.length === 0) {
    return (
       <Card className="bg-secondary/30">
          <CardContent className="p-8 text-center">
            <CardDescription>No recent reviews to show right now. Check back later!</CardDescription>
          </CardContent>
       </Card>
    )
  }

  return (
    <div className="space-y-6">
      {reviews.map((entry) => {
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
                            </p>
                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center">
                                    {[...Array(Math.floor(entry.rating))].map((_, i) => <Star key={`full-${i}`} className="w-3 h-3 text-accent fill-accent" />)}
                                    {entry.rating % 1 !== 0 && <Star key='half' className="w-3 h-3 text-accent fill-accent" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
                                    {[...Array(5-Math.ceil(entry.rating))].map((_, i) => <Star key={`empty-${i}`} className="w-3 h-3 text-accent" />)}
                                </div>
                                <span>•</span>
                                <p>
                                    Reviewed on {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                </p>
                             </div>
                         </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     {entry.review && (
                        <blockquote className="text-lg italic text-foreground/90">
                           <p>"{entry.review}"</p>
                        </blockquote>
                    )}
                    <div className="flex gap-4 items-center pt-2">
                        <div className="w-16 flex-shrink-0">
                            <Link href={`/film/${entry.film.id}`}>
                            <Image
                            src={posterUrl}
                            alt={`Poster for ${entry.film.title}`}
                            width={100}
                            height={150}
                            className="rounded-md object-cover w-full aspect-[2/3]"
                            data-ai-hint={`${entry.film.title} poster`}
                            />
                            </Link>
                        </div>
                        <div className="flex-1">
                            <Link href={`/film/${entry.film.id}`} className="hover:text-primary transition-colors">
                                <h3 className="font-headline text-lg font-semibold">{entry.film.title}</h3>
                            </Link>
                            <p className="text-sm text-muted-foreground">{entry.film.release_date?.substring(0,4)}</p>
                        </div>
                    </div>
                </CardContent>
                {user && (
                   <CardFooter>
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
