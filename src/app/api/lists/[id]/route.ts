import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';


// GET a single list with its films
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const listId = params.id;
    const list = await prisma.filmList.findFirst({
      where: { id: listId, userId },
      include: {
        films: {
          include: {
            film: true,
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const responseData = {
        ...list,
        films: list.films.map(item => ({
            ...item,
            film: {
                ...item.film,
                id: item.film.id.toString(), // ensure film ID is string
            }
        }))
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Failed to fetch list ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 });
  }
}
