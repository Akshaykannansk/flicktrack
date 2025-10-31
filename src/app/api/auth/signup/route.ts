
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSetting } from '@/services/settingsService';

export async function POST(request: Request) {
  const { fullName, username, referralCode } = await request.json();
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

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Referral Code Validation
  const validReferralCode = await getSetting("referralCode");
  if (validReferralCode && referralCode !== validReferralCode) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 403 });
  }
  
  // Use the authenticated user's ID and email
  const { id, email } = user;

  if (!email) {
    return NextResponse.json(
      { error: "User email not available from session. Cannot create database entry." },
      { status: 400 }
    );
  }

  // Create a corresponding user in your public.users table
  try {
      await prisma.user.create({
          data: {
              id: id,
              email: email,
              name: fullName,
              username: username,
              imageUrl: `https://placehold.co/128x128.png?text=${username.charAt(0).toUpperCase()}`
          }
      });
  } catch(dbError: any) {
      if (dbError.code === 'P2002') {
        // This means the user profile already exists.
        // This could happen if the endpoint is called multiple times.
        // In this case, we can consider it a success since the desired state is achieved.
      } else {
        console.error("Failed to create user in DB during signup:", dbError);
        return NextResponse.json(
          { error: 'Failed to create user profile in database.' }, 
          { status: 500 }
        );
      }
  }

  return NextResponse.json({ message: 'User profile created successfully' }, { status: 201 });
}
