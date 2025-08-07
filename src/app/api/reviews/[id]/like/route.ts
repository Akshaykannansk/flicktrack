
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// POST to like a review
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const journalEntryId = params.id;
  const supabase = createClient();

  try {
    const { data: journalEntry, error: findError } = await supabase
      .from('journal_entries')
      .select('user_id')
      .eq('id', journalEntryId)
      .single();

    if (findError || !journalEntry) throw findError;

    if (journalEntry.user_id === userId) {
        return NextResponse.json({ error: 'You cannot like your own review.' }, { status: 400 });
    }

    const { error: insertError } = await supabase.from('review_likes').insert({
      user_id: userId,
      journal_entry_id: journalEntryId,
    });

    if (insertError) {
        if (insertError.code === '23505') { // Unique constraint
            return NextResponse.json({ error: 'You have already liked this review.' }, { status: 409 });
        }
        throw insertError;
    }

    return NextResponse.json({ message: 'Successfully liked review.' }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to like review:', error);
    return NextResponse.json({ error: 'Failed to like review.' }, { status: 500 });
  }
}

// DELETE to unlike a review
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const journalEntryId = params.id;
  const supabase = createClient();

  try {
    const { error } = await supabase.from('review_likes').delete().match({
      user_id: userId,
      journal_entry_id: journalEntryId,
    });

    if (error) throw error;

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     console.error('Failed to unlike review:', error);
     return NextResponse.json({ error: 'Failed to unlike review.' }, { status: 500 });
  }
}
