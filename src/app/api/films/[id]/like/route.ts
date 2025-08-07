
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

async function upsertFilm(filmId: number) {
    await prisma.film.upsert({
        where: { id: filmId },
        update: {},
        create: { id: filmId, title: 'Unknown Film' },
    });
}

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
    await upsertFilm(filmId);

    await prisma.likedFilm.create({
      data: {
        userId: userId,
        filmId: filmId,
      },
    });

    return NextResponse.json({ message: 'Successfully liked film.' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint violation
        return NextResponse.json({ error: 'You have already liked this film.' }, { status: 409 });
    }
    console.error('Failed to like film:', error);
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
          userId: userId,
          filmId: filmId,
        },
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     // P2025 is Prisma's code for "record not found" on delete
     if (error.code === 'P2025') {
        return new NextResponse(null, { status: 204 });
     }
     console.error('Failed to unlike film:', error);
     return NextResponse.json({ error: 'Failed to unlike film.' }, { status: 500 });
  }
}
