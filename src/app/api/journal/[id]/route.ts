
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getJournalEntry, updateJournalEntry, deleteJournalEntry } from '../../../../services/reviewService';

const journalEntryUpdateSchema = z.object({
  rating: z.number().min(0.5).max(5).optional(),
  review: z.string().optional(),
  loggedDate: z.string().datetime().optional(),
});

// GET a single journal entry
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await getJournalEntry(params.id);

    if (!entry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to fetch journal entry:', error);
    return NextResponse.json({ error: 'Failed to fetch journal entry' }, { status: 500 });
  }
}

// UPDATE a journal entry
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = journalEntryUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const updatedEntry = await updateJournalEntry(params.id, user.id, validation.data);

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Failed to update journal entry:', error);
    return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 });
  }
}

// DELETE a journal entry
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await deleteJournalEntry(params.id, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete journal entry:', error);
    return NextResponse.json({ error: 'Failed to delete journal entry' }, { status: 500 });
  }
}
