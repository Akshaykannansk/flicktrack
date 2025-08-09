'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CommentWithUser } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface CommentFormProps {
  journalEntryId: string;
  onCommentAdded: (comment: CommentWithUser) => void;
}

export function CommentForm({ journalEntryId, onCommentAdded }: CommentFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
    }
    getUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${journalEntryId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to post comment');
      }

      const newComment = await res.json();
      onCommentAdded(newComment);
      setContent('');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3 pt-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.user_metadata.image_url || undefined} />
        <AvatarFallback>{user.user_metadata.full_name?.charAt(0) ?? 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post
          </Button>
        </div>
      </div>
    </form>
  );
}
