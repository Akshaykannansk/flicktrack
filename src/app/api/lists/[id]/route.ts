
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getListById, updateList, deleteList, addFilmToList } from '@/services/listService';

const updateListSchema = z.object({
  name: z.string().min(1, 'List name is required.').optional(),
  description: z.string().optional(),
  filmIds: z.array(z.number()).optional(),
});

const filmActionSchema = z.object({
  filmId: z.number(),
});


// GET a single list with its films
export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const listId = params.id;
    const list = await getListById(listId);

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
    const responseData = {
        ...list,
        films: list.films.map(item => ({
            ...item,
            film: item.film ? { ...item.film, id: item.film.id.toString() } : null
        })),
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Failed to fetch list ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 });
  }
}

// PUT (update) a list's details
export async function PUT(
  request: Request,
  { params }: any
) {
  const cookieStore = await cookies();
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
    const listId = params.id;
    const body = await request.json();
    const validation = updateListSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const updatedList = await updateList(listId, user.id, validation.data);

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error(`Failed to update list ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}

// DELETE a list
export async function DELETE(
  request: Request,
  { params }: any
) {
  const cookieStore = await cookies();
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
      const listId = params.id;
      await deleteList(listId, user.id);
      return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
      console.error(`Failed to delete list ${params.id}:`, error);
      return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}

// POST a film to a list
export async function POST(
  request: Request,
  { params }: any
) {
  const cookieStore = await cookies();
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
    const listId = params.id;
    const body = await request.json();
    const validation = filmActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const { filmId } = validation.data;
    
    const filmOnList = await addFilmToList(listId, filmId, user.id);

    return NextResponse.json(filmOnList, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint
        return NextResponse.json({ error: 'Film is already in this list' }, { status: 409 });
    }
    console.error(`Failed to add film to list ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to add film to list' }, { status: 500 });
  }
}
