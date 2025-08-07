
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// POST to like a review
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const journalEntryId = params.id;

  try {
    // Check if the user owns the review
    const journalEntry = await prisma.journalEntry.findUnique({
        where: { id: journalEntryId },
        select: { userId: true }
    });

    if (journalEntry?.userId === userId) {
        return NextResponse.json({ error: 'You cannot like your own review.' }, { status: 400 });
    }

    await prisma.reviewLike.create({
      data: {
        userId,
        journalEntryId,
      },
    });

    return NextResponse.json({ message: 'Successfully liked review.' }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to like review:', error);
    if (error.code === 'P2002') { // Unique constraint failed
        return NextResponse.json({ error: 'You have already liked this review.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to like review.' }, { status: 500 });
  }
}

// DELETE to unlike a review
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const journalEntryId = params.id;

  try {
    await prisma.reviewLike.delete({
      where: {
        userId_journalEntryId: {
          userId,
          journalEntryId,
        },
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     console.error('Failed to unlike review:', error);
     if (error.code === 'P2025') { // Record to delete not found
        return new NextResponse(null, { status: 204 }); // Already unliked, success.
    }
    return NextResponse.json({ error: 'Failed to unlike review.' }, { status: 500 });
  }
}
