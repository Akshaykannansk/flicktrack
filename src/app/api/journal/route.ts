
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getJournalEntriesForUser, createJournalEntry } from '@/services/reviewService';

const journalEntrySchema = z.object({
  filmId: z.number(),
  rating: z.number().min(0.5).max(5),
  review: z.string().optional(),
  loggedDate: z.string().datetime(),
});

// GET all journal entries for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlUserId = searchParams.get('userId');
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const authUser = session?.user;

  const targetUserId = urlUserId || authUser?.id;

  if (!targetUserId) {
    return new NextResponse('User ID must be provided or user must be authenticated', { status: 401 });
  }

  if (!urlUserId && !authUser) {
     return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    const journalEntries = await getJournalEntriesForUser(targetUserId);

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
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    const { data: { session } } = await supabase.auth.getSession();
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
    
    const newEntry = await createJournalEntry(user.id, validation.data);

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}
