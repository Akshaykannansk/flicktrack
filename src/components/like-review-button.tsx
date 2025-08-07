
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface LikeReviewButtonProps {
  journalEntryId: string;
  initialIsLiked: boolean;
  initialLikeCount: number;
}

export function LikeReviewButton({
  journalEntryId,
  initialIsLiked,
  initialLikeCount,
}: LikeReviewButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
        const method = isLiked ? 'DELETE' : 'POST';
        
        // Optimistic UI update
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
        const response = await fetch(`/api/reviews/${journalEntryId}/like`, {
            method,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to ${isLiked ? 'unlike' : 'like'} review`);
        }
        
        // On success, we can optionally refresh data from server if needed,
        // but optimistic update handles it for now.
        // router.refresh();

        } catch (error: any) {
            console.error(error);
            // Revert optimistic update on failure
            setIsLiked(isLiked);
            setLikeCount(likeCount);
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error.message,
            });
        }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={`text-muted-foreground hover:text-primary ${isLiked ? 'text-primary' : ''}`}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked ? 'fill-primary' : ''}`} />
      )}
      {likeCount}
    </Button>
  );
}
