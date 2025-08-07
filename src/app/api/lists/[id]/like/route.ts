
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// POST to like a list
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const listId = params.id;

  try {
    const list = await prisma.filmList.findUnique({
        where: { id: listId },
        select: { userId: true },
    });

    if (!list) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    if (list.userId === userId) {
        return NextResponse.json({ error: 'You cannot like your own list.' }, { status: 400 });
    }

    await prisma.likedList.create({
      data: {
        userId: userId,
        listId: listId,
      },
    });

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
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const listId = params.id;

  try {
    await prisma.likedList.delete({
      where: {
        userId_listId: {
          userId: userId,
          listId: listId,
        },
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     if (error.code === 'P2025') { // Prisma record not found
        return new NextResponse(null, { status: 204 });
     }
     console.error('Failed to unlike list:', error);
     return NextResponse.json({ error: 'Failed to unlike list.' }, { status: 500 });
  }
}
