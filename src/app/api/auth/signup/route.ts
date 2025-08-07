import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, username } = await request.json();
    
    if (!email || !password || !fullName || !username) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email },
                { username: username }
            ]
        }
    });

    if (existingUser) {
        return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
        data: {
            email: email,
            password: hashedPassword,
            name: fullName,
            username: username,
            imageUrl: `https://placehold.co/128x128.png?text=${username.charAt(0).toUpperCase()}`
        }
    });

    // Don't return the password in the response
    const { password: _, ...userResponse } = newUser;

    return NextResponse.json({ user: userResponse, message: 'Signup successful' }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
