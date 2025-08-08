
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { followUser, unfollowUser } from '@/services/userService';

// POST to follow a user
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
  const currentUser = session?.user;

  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userToFollowId = params.id;

  if (currentUser.id === userToFollowId) {
      return NextResponse.json({ error: 'You cannot follow yourself.' }, { status: 400 });
  }
  
  try {
    await followUser(currentUser.id, userToFollowId);
    return NextResponse.json({ message: 'Successfully followed user.' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // unique constraint
        return NextResponse.json({ error: 'You are already following this user.' }, { status: 409 });
    }
    console.error('Failed to follow user:', error);
    return NextResponse.json({ error: 'Failed to follow user.' }, { status: 500 });
  }
}

// DELETE to unfollow a user
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
  const currentUser = session?.user;

  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userToUnfollowId = params.id;

  try {
    await unfollowUser(currentUser.id, userToUnfollowId);
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     console.error('Failed to unfollow user:', error);
     return NextResponse.json({ error: 'Failed to unfollow user.' }, { status: 500 });
  }
}
