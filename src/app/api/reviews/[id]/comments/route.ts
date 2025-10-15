
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getCommentsForReview, createComment } from '@/services/reviewService';

// GET all comments for a review
export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const journalEntryId = params.id;
    const comments = await getCommentsForReview(journalEntryId);
    
    const responseData = comments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt,
        user: {
            id: comment.user.id,
            name: comment.user.name,
            username: comment.user.username,
            imageUrl: comment.user.imageUrl,
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
  { params }: any
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { 
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      } 
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const journalEntryId = params.id;
    const body = await request.json();
    const validation = commentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const newComment = await createComment(user.id, journalEntryId, validation.data.content);
    
    const responseData = {
        ...newComment,
        createdAt: newComment.createdAt,
        user: {
            id: newComment.user.id,
            name: newComment.user.name,
            username: newComment.user.username,
            imageUrl: newComment.user.imageUrl,
        }
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error(`Failed to create comment for review ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
