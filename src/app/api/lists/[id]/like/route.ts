
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { likeList, unlikeList } from '@/services/listService';

// POST to like a list
export async function POST(
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

  const listId = params.id;

  try {
    const result = await likeList(user.id, listId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ message: 'Successfully liked list.' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint
        return NextResponse.json({ error: 'You have already liked this list.' }, { status: 409 });
    }
    console.error('Failed to like list:', error);
    return NextResponse.json({ error: 'Failed to like list.' }, { status: 500 });
  }
}

// DELETE to unlike a list
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

  const listId = params.id;

  try {
    await unlikeList(user.id, listId);
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     if (error.code === 'P2025') { // Prisma record not found
        return new NextResponse(null, { status: 204 });
     }
     console.error('Failed to unlike list:', error);
     return NextResponse.json({ error: 'Failed to unlike list.' }, { status: 500 });
  }
}
