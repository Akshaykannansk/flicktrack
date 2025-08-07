import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const follows = await prisma.follows.findMany({
      where: { followerId: userId },
      select: { followingId: true },
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
                imageUrl: true,
            }
        }
      },
      orderBy: {
        loggedDate: 'desc',
      },
      take: 20, // Limit to the 20 most recent entries
    });

    // We need to map the user object to match PublicUser type for the component
     const responseData = feedEntries.map(entry => ({
        ...entry,
        user: {
            id: entry.user.id,
            name: entry.user.name,
            username: entry.user.username,
            imageUrl: entry.user.imageUrl,
        }
    }));


    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch activity feed:', error);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
  }
}
