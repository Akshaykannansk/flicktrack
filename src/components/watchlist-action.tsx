
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WatchlistActionProps {
  filmId: number;
  initialIsInWatchlist: boolean;
}

export function WatchlistAction({ filmId, initialIsInWatchlist }: WatchlistActionProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    setIsLoading(true);
    const method = isInWatchlist ? 'DELETE' : 'POST';
    
    try {
      const response = await fetch('/api/watchlist', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filmId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isInWatchlist ? 'remove from' : 'add to'} watchlist`);
      }

      const newWatchlistStatus = !isInWatchlist;
      setIsInWatchlist(newWatchlistStatus);

      toast({
        title: newWatchlistStatus ? 'Added to Watchlist' : 'Removed from Watchlist',
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
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={`w-32 ${isInWatchlist ? 'text-primary border-primary' : ''}`}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isInWatchlist ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Bookmark className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Updating...' : isInWatchlist ? 'On Watchlist' : 'Watchlist'}
    </Button>
  );
}

