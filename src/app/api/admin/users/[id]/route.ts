
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

// PUT update a user
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
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

  const { id } = await params;
  const { name, username, email, isAdmin } = await request.json();

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        username,
        email,
        isAdmin,
      },
    });

    await supabase.auth.admin.updateUserById(id, { email });

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
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

  const { id } = await params;

  try {
    // First, delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      // If the user doesn't exist in Auth, we can still proceed to delete from our DB
      if (authError.message !== 'User not found') {
        throw authError;
      }
    }

    // Then, delete from our database
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
