'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface FollowButtonProps {
    userId: string;
    initialIsFollowing: boolean;
}

export function FollowButton({ userId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleClick = async () => {
    setIsLoading(true);
    const method = isFollowing ? 'DELETE' : 'POST';
    
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
      }

      const newFollowStatus = !isFollowing;
      setIsFollowing(newFollowStatus);

      toast({
        title: newFollowStatus ? 'User Followed' : 'User Unfollowed',
      });
      router.refresh();

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
      variant={isFollowing ? 'outline' : 'default'}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="mr-2 h-4 w-4" /> Following
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" /> Follow
        </>
      )}
    </Button>
  );
}
