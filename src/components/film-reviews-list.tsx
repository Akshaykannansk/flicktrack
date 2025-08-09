
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Star, MessageSquare } from 'lucide-react';
import type { Film, PublicUser } from '@/lib/types';
import { Button } from './ui/button';
import { LikeReviewButton } from './like-review-button';
import { useRouter } from 'next/navigation';

interface ReviewEntry {
  id: string;
  user: PublicUser;
  rating: number;
  review: string | null;
  createdAt: string;
  logged_date: string;
  reviewLikes: { userId: string }[];
  _count: {
    reviewLikes: number;
    comments: number;
  };
}

interface FilmReviewsListProps {
    reviews: ReviewEntry[];
    currentUserId?: string;
}

export function FilmReviewsList({ reviews, currentUserId }: FilmReviewsListProps) {

  const router = useRouter();
  
  if (reviews.length === 0) {
    return (
       <Card className="mt-4 bg-secondary/30">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No reviews yet for this film.</p>
          </CardContent>
       </Card>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {reviews.map((entry) => {
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
                            <p className="text-xs text-muted-foreground">
                                Reviewed on {new Date(entry.logged_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </p>
                         </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center">
                        {[...Array(Math.floor(entry.rating))].map((_, i) => <Star key={`full-${i}`} className="w-4 h-4 text-accent fill-accent" />)}
                        {entry.rating % 1 !== 0 && <Star key='half' className="w-4 h-4 text-accent fill-accent" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
                        {[...Array(5-Math.ceil(entry.rating))].map((_, i) => <Star key={`empty-${i}`} className="w-4 h-4 text-accent" />)}
                    </div>
                    {entry.review && (
                        <blockquote className="text-base text-foreground/90 italic border-l-2 pl-4">
                            <p>"{entry.review}"</p>
                        </blockquote>
                    )}
                </CardContent>
                {currentUserId && (
                   <CardFooter className="flex items-center gap-2 pt-4">
                        {entry.user.id !== currentUserId && (
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
                             onClick={() => router.push(`/review/${entry.id}`)}
                        >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            {entry._count.comments}
                        </Button>
                   </CardFooter>
                )}
            </Card>
          )
      })}
    </div>
  );
}
