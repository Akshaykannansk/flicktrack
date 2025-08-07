
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2 } from 'lucide-react';
import { CommentForm } from './comment-form';
import { CommentList } from './comment-list';
import type { CommentWithUser } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface CommentsProps {
  journalEntryId: string;
  initialCommentCount: number;
}

export function Comments({ journalEntryId, initialCommentCount }: CommentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
        const { data } = await supabase.auth.getUser();
        setIsSignedIn(!!data.user);
    };
    checkUser();
  }, [supabase]);


  const handleToggle = async () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen && comments.length === 0) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/reviews/${journalEntryId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (error) {
        console.error('Failed to fetch comments', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const onCommentAdded = (newComment: CommentWithUser) => {
    setComments(prev => [...prev, newComment]);
    setCommentCount(prev => prev + 1);
  }

  const onCommentDeleted = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    setCommentCount(prev => prev - 1);
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="text-muted-foreground hover:text-primary"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        {commentCount}
      </Button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CommentList comments={comments} onCommentDeleted={onCommentDeleted} />
          )}
          {isSignedIn && <CommentForm journalEntryId={journalEntryId} onCommentAdded={onCommentAdded} />}
        </div>
      )}
    </div>
  );
}
