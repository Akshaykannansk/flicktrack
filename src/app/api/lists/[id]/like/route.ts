
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// POST to like a list
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const listId = params.id;
  const supabase = createClient();

  try {
    const { data: list, error: findError } = await supabase
      .from('film_lists')
      .select('user_id')
      .eq('id', listId)
      .single();

    if (findError) throw findError;

    if (list?.user_id === userId) {
        return NextResponse.json({ error: 'You cannot like your own list.' }, { status: 400 });
    }

    const { error: insertError } = await supabase.from('liked_lists').insert({
      user_id: userId,
      list_id: listId,
    });

    if (insertError) {
        if (insertError.code === '23505') { // Unique constraint
            return NextResponse.json({ error: 'You have already liked this list.' }, { status: 409 });
        }
        throw insertError;
    }

    return NextResponse.json({ message: 'Successfully liked list.' }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to like list:', error);
    return NextResponse.json({ error: 'Failed to like list.' }, { status: 500 });
  }
}

// DELETE to unlike a list
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const listId = params.id;
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('liked_lists')
      .delete()
      .eq('user_id', userId)
      .eq('list_id', listId);
    
    // Unlike Prisma, Supabase doesn't throw an error if the record to delete is not found.
    // So we don't need special handling for that case.

    if (error) throw error;

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     console.error('Failed to unlike list:', error);
     return NextResponse.json({ error: 'Failed to unlike list.' }, { status: 500 });
  }
}
