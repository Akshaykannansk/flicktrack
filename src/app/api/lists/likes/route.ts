
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET all liked lists for the user
export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const likedLists = await prisma.likedList.findMany({
      where: { userId: userId },
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
