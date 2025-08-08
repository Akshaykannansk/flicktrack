
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/auth';


const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  username: z.string().min(1, 'Username is required.'),
  bio: z.string().max(160, 'Bio is too long').optional(),
});


// PUT (update) a user's profile
export async function PUT(
  request: Request
) {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.formErrors }, { status: 400 });
    }

    const { name, username, bio } = validation.data;
    
    // Update in our DB
    const updatedDbUser = await prisma.user.update({
      where: { id: user.id },
      data: {
          name,
          username,
          bio
      },
    });

    return NextResponse.json(updatedDbUser);
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
