
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { likeFilm, unlikeFilm } from '@/services/filmService';

// POST to like a film
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { 
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      } 
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const filmId = parseInt(params.id, 10);
  if (isNaN(filmId)) {
    return NextResponse.json({ error: 'Invalid film ID.' }, { status: 400 });
  }

  try {
    await likeFilm(user.id, filmId);
    return NextResponse.json({ message: 'Successfully liked film.' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint violation
        return NextResponse.json({ error: 'You have already liked this film.' }, { status: 409 });
    }
    console.error('Failed to like film:', error);
    return NextResponse.json({ error: 'Failed to like film.' }, { status: 500 });
  }
}

// DELETE to unlike a film
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { 
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      } 
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const filmId = parseInt(params.id, 10);
  if (isNaN(filmId)) {
    return NextResponse.json({ error: 'Invalid film ID.' }, { status: 400 });
  }
  
  try {
    await unlikeFilm(user.id, filmId);
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
     if (error.code === 'P2025') { // Prisma's code for "record not found" on delete
        return new NextResponse(null, { status: 204 });
     }
     console.error('Failed to unlike film:', error);
     return NextResponse.json({ error: 'Failed to unlike film.' }, { status: 500 });
  }
}
