
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Loader2 } from 'lucide-react';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import type { Film, PublicUser, CommentWithUser as CommentWithUserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { CommentList } from '@/components/comment-list';
import { CommentForm } from '@/components/comment-form';
import { LikeReviewButton } from '@/components/like-review-button';
import { createClient } from '@/lib/supabase/client';
import type { User as AuthUser } from '@supabase/supabase-js';

interface ReviewEntry {
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
  };
}

export default function ReviewPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const [review, setReview] = useState<ReviewEntry | null>(null);
  const [comments, setComments] = useState<CommentWithUserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
    };
    getUser();
  }, []);

  useEffect(() => {
    async function fetchReviewData() {
      if (!reviewId) return;
      setIsLoading(true);

      try {
        const [reviewRes, commentsRes] = await Promise.all([
          fetch(`/api/review/${reviewId}`),
          fetch(`/api/reviews/${reviewId}/comments`),
        ]);

        if (reviewRes.status === 404) {
          notFound();
          return;
        }

        if (!reviewRes.ok || !commentsRes.ok) {
          throw new Error('Failed to fetch review data.');
        }

        const reviewData = await reviewRes.json();
        const commentsData = await commentsRes.json();

        setReview(reviewData);
        setComments(commentsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviewData();
  }, [reviewId]);
  
  const onCommentAdded = (newComment: CommentWithUserType) => {
    setComments(prev => [...prev, newComment]);
  }

  const onCommentDeleted = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  }


  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-6">
            <Skeleton className="w-40 h-60 rounded-md" />
            <div className="flex-1 space-y-4">
                 <Skeleton className="h-8 w-3/4" />
                 <Skeleton className="h-4 w-1/4" />
                 <Skeleton className="h-6 w-1/2" />
            </div>
        </div>
         <Skeleton className="h-24 w-full mt-8" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-destructive">{error}</div>;
  }
  
  if (!review) {
    return notFound();
  }
  
  const posterUrl = review.film.poster_path ? `${IMAGE_BASE_URL}w500${review.film.poster_path}` : 'https://placehold.co/400x600.png';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
         <div className="w-40 flex-shrink-0">
           <Link href={`/film/${review.film.id}`}>
            <Image
              src={posterUrl}
              alt={`Poster for ${review.film.title}`}
              width={200}
              height={300}
              className="rounded-md object-cover w-full aspect-[2/3]"
              data-ai-hint={`${review.film.title} poster`}
            />
            </Link>
        </div>
        <div className="flex-1">
             <Link href={`/film/${review.film.id}`} className="hover:text-primary transition-colors">
                <h1 className="text-3xl font-headline font-bold">{review.film.title}</h1>
            </Link>
             <p className="text-lg text-muted-foreground mt-1">
                A film by {review.film.release_date?.substring(0,4)}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm">
                <Link href={`/profile/${review.user.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Image src={review.user.imageUrl || 'https://placehold.co/40x40.png'} alt={review.user.name || 'avatar'} width={40} height={40} className="rounded-full" />
                    <div>
                        <p className="font-semibold">{review.user.name}</p>
                         <p className="text-xs text-muted-foreground">
                            Reviewed on {new Date(review.logged_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </Link>
                <div className="flex items-center">
                    {[...Array(Math.floor(review.rating))].map((_, i) => <Star key={`full-${i}`} className="w-5 h-5 text-accent fill-accent" />)}
                    {review.rating % 1 !== 0 && <Star key='half' className="w-5 h-5 text-accent fill-accent" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
                    {[...Array(5-Math.ceil(review.rating))].map((_, i) => <Star key={`empty-${i}`} className="w-5 h-5 text-accent" />)}
                </div>
            </div>
        </div>
      </div>
      
       {review.review && (
        <blockquote className="text-2xl text-foreground/90 leading-relaxed">
            <p>{review.review}</p>
        </blockquote>
      )}
      
      <div className="flex items-center gap-2">
            {user && review.user.id !== user.id && (
                <LikeReviewButton 
                    journalEntryId={review.id}
                    initialIsLiked={!!review.reviewLikes.length}
                    initialLikeCount={review._count.reviewLikes}
                />
            )}
       </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-headline font-semibold mb-4">Comments ({comments.length})</h2>
        <div className="space-y-6">
            <CommentList comments={comments} onCommentDeleted={onCommentDeleted} />
            {user && <CommentForm journalEntryId={reviewId} onCommentAdded={onCommentAdded} />}
        </div>
      </div>

    </div>
  );
}
