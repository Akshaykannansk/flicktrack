
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LikeListButtonProps {
  listId: string;
  initialIsLiked: boolean;
  onLikeToggled: () => void;
}

export function LikeListButton({ listId, initialIsLiked, onLikeToggled }: LikeListButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setIsLoading(true);
    const method = isLiked ? 'DELETE' : 'POST';
    
    try {
      const response = await fetch(`/api/lists/${listId}/like`, {
        method,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isLiked ? 'unlike' : 'like'} list`);
      }

      const newLikeStatus = !isLiked;
      setIsLiked(newLikeStatus);
      onLikeToggled(); // Refetch list data to update like count

      toast({
        title: newLikeStatus ? 'List Liked' : 'List Unliked',
      });

    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'There was a problem with your request.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isLoading}
      className={isLiked ? 'text-primary border-primary' : ''}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked ? 'fill-primary' : ''}`} />
      )}
      {isLiked ? 'Liked' : 'Like'}
    </Button>
  );
}
