import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

  try {
    await prisma.follows.create({
      data: {
        followerId: currentUserId,
        followingId: userToFollowId,
      },
    });

    return NextResponse.json({ message: 'Successfully followed user.' }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to follow user:', error);
    if (error.code === 'P2002') { // Unique constraint failed
        return NextResponse.json({ error: 'You are already following this user.' }, { status: 409 });
    }
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

  try {
    await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userToUnfollowId,
        },
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     console.error('Failed to unfollow user:', error);
     if (error.code === 'P2025') { // Record to delete not found
        return new NextResponse(null, { status: 204 }); // Already unfollowed, success.
    }
    return NextResponse.json({ error: 'Failed to unfollow user.' }, { status: 500 });
  }
}
