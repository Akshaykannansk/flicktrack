
'use client';

import { useState, useEffect } from 'react';
import type { CommentWithUser } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface CommentListProps {
  comments: CommentWithUser[];
  onCommentDeleted: (commentId: string) => void;
}

export function CommentList({ comments, onCommentDeleted }: CommentListProps) {
    const [user, setUser] = useState<User | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        }
        getUser();
    }, [supabase]);

    const handleDelete = async (commentId: string) => {
        setDeletingId(commentId);
        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete comment');
            }

            onCommentDeleted(commentId);
            toast({ title: 'Comment deleted.' });

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error.message,
            });
        } finally {
            setDeletingId(null);
        }
    }

  if (comments.length === 0) {
    return (
      <p className="text-sm text-center text-muted-foreground py-4">
        No comments yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start gap-3 group">
          <Link href={`/profile/${comment.user.id}`}>
             <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.imageUrl || undefined} alt={comment.user.name || 'avatar'} />
                <AvatarFallback>{comment.user.name?.charAt(0) ?? 'U'}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between">
                <div>
                    <Link href={`/profile/${comment.user.id}`} className="font-semibold text-sm hover:underline">
                        {comment.user.name}
                    </Link>
                    <span className="text-xs text-muted-foreground ml-2">
                        {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                </div>
                 {user?.id === comment.user.id && (
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                     >
                        {deletingId === comment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-muted-foreground" />}
                     </Button>
                 )}
            </div>
            <p className="text-sm text-primary-foreground/90">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
