
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';

// GET all comments for a review
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const journalEntryId = params.id;
    const comments = await prisma.comment.findMany({
      where: { journalEntryId: journalEntryId },
      include: {
        user: {
          select: { id: true, name: true, username: true, imageUrl: true }
        }
      },
      orderBy: { createdAt: 'asc' },
    });
    
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
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const journalEntryId = params.id;
    const body = await request.json();
    const validation = commentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content: validation.data.content,
        userId: userId,
        journalEntryId: journalEntryId,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, imageUrl: true }
        }
      },
    });
    
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
