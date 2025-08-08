
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getFavoriteFilms, updateFavoriteFilms } from '@/services/filmService';

const favoriteFilmsSchema = z.object({
  filmIds: z.array(z.number()).max(4, 'You can only have up to 4 favorite films.'),
});

// GET user's favorite films
export async function GET(request: Request) {
  const cookieStore =await cookies();
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

  try {
    const favoriteFilms = await getFavoriteFilms(user.id);
    return NextResponse.json(favoriteFilms.map(fav => fav.film));
  } catch (error) {
    console.error('Failed to fetch favorite films:', error);
    return NextResponse.json({ error: 'Failed to fetch favorite films' }, { status: 500 });
  }
}

// POST (update) user's favorite films
export async function POST(request: Request) {
  const cookieStore =await cookies();
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

  try {
    const body = await request.json();
    const validation = favoriteFilmsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const { filmIds } = validation.data;
    
    const favorite_films = await updateFavoriteFilms(user.id, filmIds);

    return NextResponse.json(favorite_films.map(fav => fav.film), { status: 200 });
  } catch (error) {
    console.error('Failed to update favorite films:', error);
    return NextResponse.json({ error: 'Failed to update favorite films' }, { status: 500 });
  }
}
