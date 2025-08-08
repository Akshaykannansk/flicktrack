
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { deleteComment, getCommentById } from '@/services/reviewService';

// DELETE a comment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { 
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          await cookieStore.set({ name, value, ...options })
        },
        async remove(name: string, options: CookieOptions) {
          await cookieStore.set({ name, value: '', ...options })
        },
      } 
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const commentId = params.id;

  try {
    const comment = await getCommentById(commentId);

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
    }

    if (comment.userId !== user.id) {
      return NextResponse.json({ error: 'You are not authorized to delete this comment.' }, { status: 403 });
    }

    await deleteComment(commentId);

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Failed to delete comment ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete comment.' }, { status: 500 });
  }
}
