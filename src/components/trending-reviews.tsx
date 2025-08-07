
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Star, MessageSquare } from 'lucide-react';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import type { Film, PublicUser } from '@/lib/types';
import { CardDescription } from './ui/card';
import { auth } from '@clerk/nextjs/server';
import { LikeReviewButton } from './like-review-button';
import { createClient } from '@/lib/supabase/server';
import { Comments } from './comments';

interface TrendingReviewEntry {
  id: string;
  film: Film;
  user: PublicUser;
  rating: number;
  review: string | null;
  created_at: string;
  liked_by_user: { user_id: string }[];
  review_likes_count: number;
  comments_count: number;
}


async function getTrendingReviews(): Promise<TrendingReviewEntry[]> {
  const { userId } = auth();
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
        .rpc('get_trending_reviews', { p_user_id: userId });

    if (error) throw error;
    
    return data as TrendingReviewEntry[];
  } catch (error) {
    console.error('Failed to fetch trending reviews:', error);
    return [];
  }
}

export async function TrendingReviews() {
  const reviews = await getTrendingReviews();
  const { userId } = auth();
  
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
                            <Image src={entry.user.imageUrl} alt={entry.user.name || 'avatar'} width={40} height={40} className="rounded-full" />
                         </Link>
                         <div>
                            <p className="text-sm font-semibold text-foreground">
                                <Link href={`/profile/${entry.user.id}`} className="hover:text-primary transition-colors">{entry.user.name}</Link>
                                <span className="text-muted-foreground font-normal ml-1.5">reviewed a film</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
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
                {userId && (
                   <CardFooter className="flex-col items-start gap-4">
                        <div className="flex items-center gap-2">
                            {entry.user.id !== userId && (
                                <LikeReviewButton 
                                    journalEntryId={entry.id}
                                    initialIsLiked={!!entry.liked_by_user}
                                    initialLikeCount={entry.review_likes_count}
                                />
                            )}
                             <Comments 
                                journalEntryId={entry.id}
                                initialCommentCount={entry.comments_count}
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
