
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CopyListButtonProps {
  listId: string;
}

export function CopyListButton({ listId }: CopyListButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCopy = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/lists/${listId}/copy`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to copy list');
      }

      const newList = await response.json();

      toast({
        title: 'List Copied!',
        description: `A new list has been added to your collections.`,
      });

      router.push(`/lists/${newList.id}`);

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
      onClick={handleCopy}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      Copy List
    </Button>
  );
}
