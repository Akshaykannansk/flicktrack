
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/services/prisma';

export async function POST(request: Request) {
  const { email, password, fullName, username } = await request.json();
  const cookieStore = cookies();
    const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );


  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username: username,
        image_url: `https://placehold.co/128x128.png?text=${username.charAt(0).toUpperCase()}`
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  // Create a corresponding user in your public.users table
  if (data.user) {
    try {
        await prisma.user.create({
            data: {
                id: data.user.id,
                email: email,
                name: fullName,
                username: username,
                imageUrl: `https://placehold.co/128x128.png?text=${username.charAt(0).toUpperCase()}`
            }
        });
    } catch(dbError) {
        // If the DB insert fails, you might want to handle it
        // e.g., delete the supabase user or log the inconsistency
        console.error("Failed to create user in DB after Supabase signup:", dbError);
        // For now, we'll let the signup succeed on Supabase but log the error.
    }
  }


  return NextResponse.json({ user: data.user, message: 'Signup successful' }, { status: 201 });
}
