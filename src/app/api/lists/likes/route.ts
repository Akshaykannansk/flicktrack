
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET all liked lists for the user
export async function GET(request: Request) {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
    
  try {
    const likedLists = await prisma.likedList.findMany({
      where: { userId: user.id },
      select: { listId: true },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(likedLists);
  } catch (error) {
    console.error('Failed to fetch liked lists:', error);
    return NextResponse.json({ error: 'Failed to fetch liked lists' }, { status: 500 });
  }
}
