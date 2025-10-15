
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface FavoriteActionProps {
  filmId: number;
  initialIsFavorite: boolean;
}

export function FavoriteAction({ filmId, initialIsFavorite }: FavoriteActionProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    setIsLoading(true);
    
    try {
      // We need to fetch current favorites first, then add/remove
      const favResponse = await fetch('/api/profile/favorites');
      if (!favResponse.ok) throw new Error('Could not fetch current favorites.');
      const currentFavorites: {id: number}[] = await favResponse.json();
      
      let newFavoriteIds: number[];
      
      if (isFavorite) {
        newFavoriteIds = currentFavorites.filter(fav => fav.id !== filmId).map(f => f.id);
      } else {
        if (currentFavorites.length >= 4) {
          toast({
            variant: 'destructive',
            title: 'Favorites Limit Reached',
            description: 'You can only have up to 4 favorite films.',
          });
          setIsLoading(false);
          return;
        }
        newFavoriteIds = [...currentFavorites.map(f => f.id), filmId];
      }

      const response = await fetch('/api/profile/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filmIds: newFavoriteIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update favorites.`);
      }

      const newFavoriteStatus = !isFavorite;
      setIsFavorite(newFavoriteStatus);

      toast({
        title: newFavoriteStatus ? 'Added to Favorites' : 'Removed from Favorites',
      });
      router.refresh(); // Refresh to update favorite displays elsewhere

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
      className={`w-32 ${isFavorite ? 'text-accent border-accent' : ''}`}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Star className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-accent' : ''}`} />
      )}
      {isLoading ? 'Updating...' : isFavorite ? 'Favorite' : 'Favorite'}
    </Button>
  );
}
