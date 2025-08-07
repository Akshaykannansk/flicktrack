
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { auth, clerkClient } from '@clerk/nextjs/server';

const journalEntrySchema = z.object({
  filmId: z.number(),
  rating: z.number().min(0.5).max(5),
  review: z.string().optional(),
  loggedDate: z.string().datetime(),
});

async function upsertUser(userId: string) {
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
        throw new Error('User not found in Clerk');
    }

    const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;

    if (!primaryEmail) {
        throw new Error('Primary email not found for user');
    }

    return await prisma.user.upsert({
        where: { id: userId },
        update: {
            email: primaryEmail,
            name: clerkUser.fullName,
        },
        create: {
            id: userId,
            email: primaryEmail,
            name: clerkUser.fullName,
        }
    });
}


// GET all journal entries for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlUserId = searchParams.get('userId');
  const { userId: authUserId } = auth();

  const targetUserId = urlUserId || authUserId;

  if (!targetUserId) {
    return new NextResponse('User ID must be provided or user must be authenticated', { status: 401 });
  }

  // If a specific user's journal is requested, anyone can view it.
  // If no user is specified, it defaults to the logged-in user's journal, so we must have an authUserId.
  if (!urlUserId && !authUserId) {
     return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    const journalEntries = await prisma.journalEntry.findMany({
      where: { userId: targetUserId },
      include: {
        film: true, 
      },
      orderBy: {
        loggedDate: 'desc',
      },
    });

    const responseData = journalEntries.map(entry => ({
        id: entry.id,
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
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

  try {
    await upsertUser(userId);
    
    const body = await request.json();
    const validation = journalEntrySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }
    
    const { filmId, rating, review, loggedDate } = validation.data;

    await prisma.film.upsert({
      where: { id: filmId },
      update: {},
      create: {
        id: filmId,
        title: 'Unknown Film', // You might want to fetch this from TMDB
      },
    });

    const newEntry = await prisma.journalEntry.create({
      data: {
        userId: userId,
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
