
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { auth, clerkClient } from '@clerk/nextjs/server';

const journalEntrySchema = z.object({
  filmId: z.number(),
  rating: z.number().min(0.5).max(5),
  review: z.string().optional(),
  loggedDate: z.string().datetime(),
});

async function upsertUser(supabase: ReturnType<typeof createClient>, userId: string) {
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
        throw new Error('User not found in Clerk');
    }

    const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;

    if (!primaryEmail) {
        throw new Error('Primary email not found for user');
    }

    const { error } = await supabase.from('users').upsert({
        id: userId,
        email: primaryEmail,
        name: clerkUser.fullName,
        username: clerkUser.username,
        image_url: clerkUser.imageUrl,
    }, { onConflict: 'id' });

    if (error) throw error;
}

async function upsertFilm(supabase: ReturnType<typeof createClient>, filmId: number) {
    const { error } = await supabase
      .from('films')
      .upsert({ id: filmId, title: 'Unknown Film' }, { onConflict: 'id' });
    if (error) throw error;
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

  if (!urlUserId && !authUserId) {
     return new NextResponse('Unauthorized', { status: 401 });
  }
  
  const supabase = createClient();
  
  try {
    const { data: journalEntries, error } = await supabase
      .from('journal_entries')
      .select('*, films(*)')
      .eq('user_id', targetUserId)
      .order('logged_date', { ascending: false });

    if (error) throw error;

    const responseData = journalEntries.map(entry => ({
        id: entry.id,
        film: {
            id: entry.films.id.toString(),
            title: entry.films.title,
            poster_path: entry.films.poster_path,
            release_date: entry.films.release_date,
            vote_average: entry.films.vote_average,
            overview: entry.films.overview,
        },
        rating: entry.rating,
        review: entry.review,
        loggedDate: entry.logged_date,
    }));

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
  
  const supabase = createClient();

  try {
    await upsertUser(supabase, userId);
    
    const body = await request.json();
    const validation = journalEntrySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }
    
    const { filmId, rating, review, loggedDate } = validation.data;
    
    await upsertFilm(supabase, filmId);

    const { data: newEntry, error } = await supabase.from('journal_entries').insert({
      user_id: userId,
      film_id: filmId,
      rating,
      review,
      logged_date: loggedDate,
    }).select().single();

    if (error) throw error;

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}
