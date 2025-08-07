
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// POST to copy a list
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId: newOwnerId } = auth();
  if (!newOwnerId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const listToCopyId = params.id;

  try {
    // 1. Find the original list and its films
    const originalList = await prisma.filmList.findUnique({
      where: { id: listToCopyId },
      include: { films: { select: { filmId: true } } },
    });

    if (!originalList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
    if (originalList.userId === newOwnerId) {
        return NextResponse.json({ error: "You cannot copy your own list." }, { status: 400 });
    }

    // 2. Create the new list and its film connections in a transaction
    const newList = await prisma.$transaction(async (tx) => {
      const createdList = await tx.filmList.create({
        data: {
          name: `${originalList.name} (Copy)`,
          description: originalList.description,
          userId: newOwnerId,
        },
      });

      if (originalList.films.length > 0) {
        await tx.filmsOnList.createMany({
          data: originalList.films.map(film => ({
            listId: createdList.id,
            filmId: film.filmId,
          })),
        });
      }
      return createdList;
    });

    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    console.error(`Failed to copy list ${listToCopyId}:`, error);
    return NextResponse.json({ error: 'Failed to copy list' }, { status: 500 });
  }
}
