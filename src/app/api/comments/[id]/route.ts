
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// DELETE a comment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const commentId = params.id;

    // First, verify the user owns the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
    }

    if (comment.userId !== userId) {
      return NextResponse.json({ error: 'You are not authorized to delete this comment.' }, { status: 403 });
    }

    // If authorized, delete the comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Failed to delete comment ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete comment.' }, { status: 500 });
  }
}
