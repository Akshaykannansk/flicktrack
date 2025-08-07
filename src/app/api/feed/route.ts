
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    const follows = await prisma.follows.findMany({
        where: { followerId: user.id },
        select: { followingId: true }
    });

    const followingIds = follows.map(f => f.followingId);

    if (followingIds.length === 0) {
      return NextResponse.json([]);
    }

    const feedEntries = await prisma.journalEntry.findMany({
      where: {
        userId: {
          in: followingIds,
        },
      },
      include: {
        film: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true
          }
        },
      },
      orderBy: {
        logged_date: 'desc',
      },
      take: 20,
    });
    
    return NextResponse.json(feedEntries);
  } catch (error) {
    console.error('Failed to fetch activity feed:', error);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
  }
}
