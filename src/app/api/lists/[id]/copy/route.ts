
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
  const supabase = createClient();

  try {
    // 1. Find the original list and its films
    const { data: originalList, error: listError } = await supabase
      .from('film_lists')
      .select(`
        *,
        films_on_lists ( film_id )
      `)
      .eq('id', listToCopyId)
      .single();

    if (listError || !originalList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
    if (originalList.user_id === newOwnerId) {
        return NextResponse.json({ error: "You cannot copy your own list." }, { status: 400 });
    }

    // Transaction to create new list and add films
    const { data: newList, error: transactionError } = await supabase.rpc('copy_film_list', {
      original_list_id: listToCopyId,
      new_owner_id: newOwnerId,
      new_list_name: `${originalList.name} (Copy)`,
      new_list_description: originalList.description
    });
    
    if (transactionError) throw transactionError;

    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    console.error(`Failed to copy list ${listToCopyId}:`, error);
    return NextResponse.json({ error: 'Failed to copy list' }, { status: 500 });
  }
}
