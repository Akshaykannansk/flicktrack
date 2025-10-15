// src/components/watchlist-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WatchlistButtonProps {
  filmId: string;
  initialIsInWatchlist: boolean;
}

export function WatchlistButton({ filmId, initialIsInWatchlist }: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setIsLoading(true);
    const method = isInWatchlist ? 'DELETE' : 'POST';
    
    const numericFilmId = parseInt(filmId, 10);
    if (isNaN(numericFilmId)) {
        toast({
            variant: 'destructive',
            title: 'Invalid Film ID',
        });
        setIsLoading(false);
        return;
    }
    
    try {
      const response = await fetch('/api/watchlist', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filmId: numericFilmId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isInWatchlist ? 'remove from' : 'add to'} watchlist`);
      }

      const newWatchlistStatus = !isInWatchlist;
      setIsInWatchlist(newWatchlistStatus);

      toast({
        title: newWatchlistStatus ? 'Added to Watchlist' : 'Removed from Watchlist',
        description: `The film has been ${newWatchlistStatus ? 'added to' : 'removed from'} your watchlist.`,
      });

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      variant="outline"
      onClick={handleClick}
      disabled={isLoading}
      className={isInWatchlist ? 'text-primary border-primary' : ''}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : isInWatchlist ? (
        <Check className="mr-2 h-5 w-5" />
      ) : (
        <Bookmark className="mr-2 h-5 w-5" />
      )}
      {isLoading ? 'Updating...' : isInWatchlist ? 'On Watchlist' : 'Add to Watchlist'}
    </Button>
  );
}
