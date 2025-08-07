
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';

// GET all comments for a review
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  try {
    const journalEntryId = params.id;
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users ( id, name, username, image_url )
      `)
      .eq('journal_entry_id', journalEntryId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    const responseData = comments.map(comment => ({
        ...comment,
        createdAt: comment.created_at,
        user: {
            id: comment.user.id,
            name: comment.user.name,
            username: comment.user.username,
            imageUrl: comment.user.image_url,
        }
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Failed to fetch comments for review ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}


const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty.').max(1000, 'Comment is too long.'),
});

// POST a new comment
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const supabase = createClient();

  try {
    const journalEntryId = params.id;
    const body = await request.json();
    const validation = commentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const { data: newComment, error } = await supabase.from('comments').insert({
      content: validation.data.content,
      user_id: userId,
      journal_entry_id: journalEntryId,
    }).select(`
      *,
      user:users ( id, name, username, image_url )
    `).single();

    if (error) throw error;
    
    const responseData = {
        ...newComment,
        createdAt: newComment.created_at,
        user: {
            id: newComment.user.id,
            name: newComment.user.name,
            username: newComment.user.username,
            imageUrl: newComment.user.image_url,
        }
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error(`Failed to create comment for review ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
