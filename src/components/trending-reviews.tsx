
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Star, MessageSquare } from 'lucide-react';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import type { Film, PublicUser } from '@/lib/types';
import { CardDescription } from './ui/card';
import { LikeReviewButton } from './like-review-button';
import { Comments } from './comments';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getTrendingReviews as fetchTrendingReviews } from '@/services/reviewService';

interface TrendingReviewEntry {
  id: string;
  film: Film;
  user: PublicUser;
  rating: number;
  review: string | null;
  created_at: string;
  reviewLikes: { userId: string }[];
  _count: {
    reviewLikes: number;
    comments: number;
  }
}

export async function TrendingReviews() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
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
            <Card key={entry.id} className="bg-secondary/50 border-0 overflow-hidden">
                <CardHeader>
                    <div className="flex items-center gap-3">
                         <Link href={`/profile/${entry.user.id}`}>
                            <Image src={entry.user.imageUrl || 'https://placehold.co/40x40.png'} alt={entry.user.name || 'avatar'} width={40} height={40} className="rounded-full" />
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
                {user && (
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
