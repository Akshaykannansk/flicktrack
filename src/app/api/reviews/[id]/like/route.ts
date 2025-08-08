
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { likeReview, unlikeReview } from '@/services/reviewService';

// POST to like a review
export async function POST(
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

  const journalEntryId = params.id;

  try {
    const result = await likeReview(user.id, journalEntryId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ message: 'Successfully liked review.' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint
        return NextResponse.json({ error: 'You have already liked this review.' }, { status: 409 });
    }
    console.error('Failed to like review:', error);
    return NextResponse.json({ error: 'Failed to like review.' }, { status: 500 });
  }
}

// DELETE to unlike a review
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

  const journalEntryId = params.id;

  try {
    await unlikeReview(user.id, journalEntryId);
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma record not found
      return new NextResponse(null, { status: 204 });
    }
     console.error('Failed to unlike review:', error);
     return NextResponse.json({ error: 'Failed to unlike review.' }, { status: 500 });
  }
}
