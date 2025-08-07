
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// POST to follow a user
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId: currentUserId } = auth();
  if (!currentUserId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userToFollowId = params.id;

  if (currentUserId === userToFollowId) {
      return NextResponse.json({ error: 'You cannot follow yourself.' }, { status: 400 });
  }
  
  const supabase = createClient();

  try {
    const { error } = await supabase.from('follows').insert({
      follower_id: currentUserId,
      following_id: userToFollowId,
    });

    if (error) {
        if (error.code === '23505') { // unique constraint
             return NextResponse.json({ error: 'You are already following this user.' }, { status: 409 });
        }
        throw error;
    }

    return NextResponse.json({ message: 'Successfully followed user.' }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to follow user:', error);
    return NextResponse.json({ error: 'Failed to follow user.' }, { status: 500 });
  }
}

// DELETE to unfollow a user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId: currentUserId } = auth();
  if (!currentUserId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userToUnfollowId = params.id;
  const supabase = createClient();

  try {
    const { error } = await supabase.from('follows').delete().match({
        follower_id: currentUserId,
        following_id: userToUnfollowId,
    });
    
    if (error) throw error;

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     console.error('Failed to unfollow user:', error);
     return NextResponse.json({ error: 'Failed to unfollow user.' }, { status: 500 });
  }
}
