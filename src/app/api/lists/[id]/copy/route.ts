
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { copyList } from '@/services/listService';

// POST to copy a list
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const newOwner = session?.user;

  if (!newOwner) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const listToCopyId = params.id;

  try {
    const newList = await copyList(listToCopyId, newOwner.id);
    if (!newList) {
        return NextResponse.json({ error: 'Could not copy list. It may not exist or you may be the owner.' }, { status: 400 });
    }
    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    console.error(`Failed to copy list ${listToCopyId}:`, error);
    return NextResponse.json({ error: 'Failed to copy list' }, { status: 500 });
  }
}
