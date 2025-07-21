import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// For this prototype, we'll use a hardcoded user ID.
// In a real app, you'd get this from the user's session.
const USER_ID = 'user_2jvcJkLgQf9Qz3gYtH8rXz9Ew1B';

const journalEntrySchema = z.object({
  filmId: z.number(),
  rating: z.number().min(0.5).max(5),
  review: z.string().optional(),
  loggedDate: z.string().datetime(),
});

// GET all journal entries for the user
export async function GET() {
  try {
    const journalEntries = await prisma.journalEntry.findMany({
      where: { userId: USER_ID },
      include: {
        film: true, // Include the related film data
      },
      orderBy: {
        loggedDate: 'desc',
      },
    });

    // We need to transform the data slightly to match the expected front-end LoggedFilm type
    const responseData = journalEntries.map(entry => ({
        film: {
            id: entry.film.id.toString(),
            title: entry.film.title,
            poster_path: entry.film.posterPath,
            release_date: entry.film.releaseDate,
            vote_average: entry.film.voteAverage,
            overview: entry.film.overview,
        },
        rating: entry.rating,
        review: entry.review,
        loggedDate: entry.loggedDate.toISOString()
    }))

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }
}

// POST a new journal entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = journalEntrySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }
    
    const { filmId, rating, review, loggedDate } = validation.data;

    // In a real app, you would also upsert the film details if they don't exist yet
    // For now, we assume films from the seed are present.

    const newEntry = await prisma.journalEntry.create({
      data: {
        userId: USER_ID,
        filmId,
        rating,
        review,
        loggedDate: new Date(loggedDate),
      },
    });

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}
