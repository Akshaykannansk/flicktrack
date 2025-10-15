
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ListPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FilmListSummary } from '@/lib/types';

interface AddToListButtonProps {
  filmId: number;
}

interface AddToListDialogProps {
    filmId: number;
    children: React.ReactNode;
}

function AddToListDialog({ filmId, children }: AddToListDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [lists, setLists] = React.useState<FilmListSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchLists() {
      if (open) {
        setIsLoading(true);
        try {
          const response = await fetch('/api/lists');
          if (!response.ok) {
            throw new Error('Failed to fetch lists.');
          }
          const data = await response.json();
          setLists(data);
        } catch (error) {
          console.error(error);
          toast({
            variant: 'destructive',
            title: 'Could not load lists.',
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchLists();
  }, [open, toast]);

  const handleAddToList = async (listId: string) => {
    setIsAdding(listId);
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
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message,
      });
    } finally {
        setIsAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to a list</DialogTitle>
          <DialogDescription>Select a list to add this film to.</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto space-y-2 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : lists.length > 0 ? (
            lists.map((list) => (
              <Button
                key={list.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleAddToList(list.id)}
                disabled={!!isAdding}
              >
                {isAdding === list.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {list.name}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center">No lists found. You can create one from the "Lists" page.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


export function AddToListButton({ filmId }: AddToListButtonProps) {
  return (
    <AddToListDialog filmId={filmId}>
      <Button variant="outline" size="sm" className="w-32">
        <ListPlus className="mr-2 h-4 w-4" /> Add to List
      </Button>
    </AddToListDialog>
  );
}
