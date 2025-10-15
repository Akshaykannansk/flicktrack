
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface LikeActionProps {
  filmId: number;
  initialIsLiked: boolean;
}

export function LikeAction({ filmId, initialIsLiked }: LikeActionProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    setIsLoading(true);
    const method = isLiked ? 'DELETE' : 'POST';
    
    try {
      const response = await fetch(`/api/films/${filmId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isLiked ? 'unlike' : 'like'} film`);
      }

      const newLikeStatus = !isLiked;
      setIsLiked(newLikeStatus);

      toast({
        title: newLikeStatus ? 'Film Liked' : 'Film Unliked',
      });
      router.refresh();

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
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={`w-32 ${isLiked ? 'text-destructive border-destructive' : ''}`}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-destructive' : ''}`} />
      )}
      {isLoading ? 'Updating...' : isLiked ? 'Liked' : 'Like'}
    </Button>
  );
}
