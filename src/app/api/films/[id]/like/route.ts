
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

// POST to like a film
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const filmId = parseInt(params.id, 10);
  if (isNaN(filmId)) {
    return NextResponse.json({ error: 'Invalid film ID.' }, { status: 400 });
  }

  try {
     // Ensure the film exists, create if not
    await prisma.film.upsert({
      where: { id: filmId },
      update: {},
      create: {
        id: filmId,
        title: 'Unknown Film',
      },
    });

    await prisma.likedFilm.create({
      data: {
        userId,
        filmId,
      },
    });

    return NextResponse.json({ message: 'Successfully liked film.' }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to like film:', error);
    if (error.code === 'P2002') { // Unique constraint failed
        return NextResponse.json({ error: 'You have already liked this film.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to like film.' }, { status: 500 });
  }
}

// DELETE to unlike a film
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const filmId = parseInt(params.id, 10);
  if (isNaN(filmId)) {
    return NextResponse.json({ error: 'Invalid film ID.' }, { status: 400 });
  }

  try {
    await prisma.likedFilm.delete({
      where: {
        userId_filmId: {
          userId,
          filmId,
        },
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     console.error('Failed to unlike film:', error);
     if (error.code === 'P2025') { // Record to delete not found
        return new NextResponse(null, { status: 204 }); // Already unliked, success.
    }
    return NextResponse.json({ error: 'Failed to unlike film.' }, { status: 500 });
  }
}
