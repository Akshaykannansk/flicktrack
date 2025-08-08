
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const journalEntrySchema = z.object({
  filmId: z.number(),
  rating: z.number().min(0.5).max(5),
  review: z.string().optional(),
  loggedDate: z.string().datetime(),
});

async function upsertFilm(filmId: number) {
    await prisma.film.upsert({
        where: { id: filmId },
        update: {},
        create: { id: filmId, title: 'Unknown Film' },
    });
}


// GET all journal entries for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlUserId = searchParams.get('userId');
  const session = await getSession();
  const authUser = session?.user;

  const targetUserId = urlUserId || authUser?.id;

  if (!targetUserId) {
    return new NextResponse('User ID must be provided or user must be authenticated', { status: 401 });
  }

  if (!urlUserId && !authUser) {
     return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    const journalEntries = await prisma.journalEntry.findMany({
      where: { userId: targetUserId },
      include: {
        film: true,
      },
      orderBy: {
        logged_date: 'desc',
      },
    });

    const responseData = journalEntries.map(entry => ({
        ...entry,
        id: entry.id,
        film: {
            ...entry.film,
            id: entry.film.id.toString(),
        },
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }
}

// POST a new journal entry
export async function POST(request: Request) {
    const session = await getSession();
    const user = session?.user;

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  
  try {
    const body = await request.json();
    const validation = journalEntrySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }
    
    const { filmId, rating, review, loggedDate } = validation.data;
    
    await upsertFilm(filmId);

    const newEntry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        filmId: filmId,
        rating,
        review,
        logged_date: loggedDate,
      },
    });

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}
