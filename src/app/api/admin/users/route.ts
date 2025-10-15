
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET all users
export async function GET(request: Request) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
                cookieStore.set({ name, value: '', ...options });
            },
          },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!adminUser || !adminUser.isAdmin) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        orderBy: {
            createdAt: 'desc',
        },
    });

    return NextResponse.json(users);
}


// POST a new admin user
export async function POST(request: Request) {
  const cookieStore = await cookies();
  // Use the anon key for the initial user creation
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { email, password, fullName, username } = await request.json();

  const { data: newUser, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  if (!newUser || !newUser.user) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }

  try {
    await prisma.user.create({
      data: {
        id: newUser.user.id,
        email: email,
        name: fullName,
        username: username,
        isAdmin: true,
      },
    });
  } catch (dbError) {
    console.error("Failed to create admin user in DB:", dbError);

    // Use the service role key to delete the user from Supabase auth if DB creation fails
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
                cookieStore.set({ name, value: '', ...options });
            },
          },
        }
    );
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: 'Failed to create admin user profile in database.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Admin user created successfully' }, { status: 201 });
}
