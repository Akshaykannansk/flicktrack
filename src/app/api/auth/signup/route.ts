import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  try {
    const { email, password, fullName, username } = await request.json();
    
    if (!email || !password || !fullName || !username) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                user_name: username,
                avatar_url: `https://placehold.co/128x128.png?text=${username.charAt(0)}`
            }
        }
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    if (data.user) {
        // Now create the user in your public.users table
        await prisma.user.create({
            data: {
                id: data.user.id,
                email: email,
                name: fullName,
                username: username,
                imageUrl: data.user.user_metadata.avatar_url,
            }
        });
    }

    return NextResponse.json({ user: data.user, message: 'Signup successful, please verify your email.' }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
