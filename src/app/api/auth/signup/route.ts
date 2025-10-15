
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSetting } from '@/services/settingsService';

export async function POST(request: Request) {
  const { email, password, fullName, username, id, referralCode } = await request.json();

  // 1. Referral Code Validation
  const validReferralCode = await getSetting("referralCode");
  if (validReferralCode && referralCode !== validReferralCode) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 403 });
  }
  
  if (!id) {
    // This part of the logic runs *after* Supabase has already created the user.
    // If we don't have an ID, we can't create the user in our DB, and we should
    // not proceed with the Supabase client logic. We'll return an error.
    return NextResponse.json(
      { error: 'User ID is missing. Cannot create database entry.' }, 
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
        // User already exists, which is fine in this context.
        // This might happen if the client-side call was duplicated.
        // We can safely ignore this and proceed.
      } else {
        // For other errors, we should log them and return a server error.
        console.error("Failed to create user in DB during signup:", dbError);
        return NextResponse.json(
          { error: 'Failed to create user profile in database.' }, 
          { status: 500 }
        );
      }
  }

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

  // Since the user is already signed up on the client, we don't need to re-run
  // signUp here. We're just creating the local DB record.
  // The client will handle the user session and redirect.
  return NextResponse.json({ message: 'User profile created successfully' }, { status: 201 });
}
