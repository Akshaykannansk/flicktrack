

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Star, MessageSquare } from 'lucide-react';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import type { Film, PublicUser } from '@/lib/types';
import { CardDescription } from './ui/card';
import { LikeReviewButton } from './like-review-button';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getTrendingReviews as fetchTrendingReviews } from '@/services/reviewService';
import { FeedSkeleton } from './following-feed';
import { Button } from './ui/button';

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

export async function TrendingReviews() {
  const cookieStore =await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options })
      },
    },
  });  
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  const reviews = await fetchTrendingReviews(user?.id) as unknown as TrendingReviewEntry[];
  
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
            <Card key={entry.id} className="bg-secondary/50 border-0 overflow-hidden hover:bg-secondary/80 transition-colors">
                 <Link href={`/review/${entry.id}`} className="block">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Image src={entry.user.imageUrl || 'https://placehold.co/40x40.png'} alt={entry.user.name || 'avatar'} width={40} height={40} className="rounded-full" />
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    <span className="hover:text-primary transition-colors">{entry.user.name}</span>
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
                            <blockquote className="text-lg text-foreground/90">
                                <p>{entry.review}</p>
                            </blockquote>
                        )}
                        <div className="flex gap-4 items-center pt-2">
                            <div className="w-16 flex-shrink-0">
                                <Image
                                src={posterUrl}
                                alt={`Poster for ${entry.film.title}`}
                                width={100}
                                height={150}
                                className="rounded-md object-cover w-full aspect-[2/3]"
                                data-ai-hint={`${entry.film.title} poster`}
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-headline text-lg font-semibold">{entry.film.title}</h3>
                                <p className="text-sm text-muted-foreground">{entry.film.release_date ? String(entry.film.release_date).substring(0,4) : 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Link>
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
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary"
                                asChild
                            >
                                <Link href={`/review/${entry.id}`}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    {entry._count.comments}
                                 </Link>
                            </Button>
                        </div>
                </CardFooter>
                )}
            </Card>
          )
      })}
    </div>
  );
}
