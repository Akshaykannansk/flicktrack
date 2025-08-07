
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// POST to follow a user
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userToFollowId = params.id;

  if (currentUser.id === userToFollowId) {
      return NextResponse.json({ error: 'You cannot follow yourself.' }, { status: 400 });
  }
  
  try {
    await prisma.follows.create({
      data: {
        followerId: currentUser.id,
        followingId: userToFollowId,
      },
    });

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
  const supabase = createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userToUnfollowId = params.id;

  try {
    await prisma.follows.delete({
        where: {
            followerId_followingId: {
                followerId: currentUser.id,
                followingId: userToUnfollowId,
            }
        },
    });
    
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     console.error('Failed to unfollow user:', error);
     return NextResponse.json({ error: 'Failed to unfollow user.' }, { status: 500 });
  }
}
