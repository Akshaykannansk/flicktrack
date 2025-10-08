
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, email, full_name, username, avatar_url } = body;

    // Basic validation
    if (!id || !email || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        id: id,
        email: email,
        name: full_name, // Ensure your prisma schema model uses 'name'
        username: username,
        imageUrl: avatar_url, // Corrected from image_url to imageUrl
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    // Handle potential errors, like a user already existing
    if (error.code === 'P2002') { // Prisma code for unique constraint violation
        return NextResponse.json({ message: 'User already exists.' }, { status: 200 });
    }
    return NextResponse.json({ error: 'Failed to create user', details: error.message }, { status: 500 });
  }
}
