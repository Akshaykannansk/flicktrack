
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { likeList, unlikeList } from '@/services/listService';

// POST to like a list
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const listId = params.id;

  try {
    const result = await likeList(user.id, listId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ message: 'Successfully liked list.' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint
        return NextResponse.json({ error: 'You have already liked this list.' }, { status: 409 });
    }
    console.error('Failed to like list:', error);
    return NextResponse.json({ error: 'Failed to like list.' }, { status: 500 });
  }
}

// DELETE to unlike a list
export async function DELETE(
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const listId = params.id;

  try {
    await unlikeList(user.id, listId);
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     if (error.code === 'P2025') { // Prisma record not found
        return new NextResponse(null, { status: 204 });
     }
     console.error('Failed to unlike list:', error);
     return NextResponse.json({ error: 'Failed to unlike list.' }, { status: 500 });
  }
}
