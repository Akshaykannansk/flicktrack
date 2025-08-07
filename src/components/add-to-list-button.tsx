
'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ListPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FilmListSummary } from '@/lib/types';

interface AddToListButtonProps {
  filmId: number;
}

export function AddToListButton({ filmId }: AddToListButtonProps) {
  const [lists, setLists] = useState<FilmListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch user's lists when the dropdown is about to open.
    // This could be optimized to fetch once and cache.
    async function fetchLists() {
      try {
        const response = await fetch('/api/lists');
        if (!response.ok) {
          throw new Error('Failed to fetch lists.');
        }
        const data = await response.json();
        setLists(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLists();
  }, []);

  const handleAddToList = async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to list');
      }

      const listName = lists.find(list => list.id === listId)?.name;
      toast({
        title: 'Film Added',
        description: `Successfully added to "${listName || 'list'}".`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-32">
          <ListPlus className="mr-2 h-4 w-4" /> Add to List
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Add to a list</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </DropdownMenuItem>
        ) : lists.length > 0 ? (
          lists.map((list) => (
            <DropdownMenuItem key={list.id} onClick={() => handleAddToList(list.id)}>
              {list.name}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No lists found.</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
