
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  const { userId } = auth();

  try {
    const trendingReviews = await prisma.journalEntry.findMany({
      where: {
        review: {
          not: null, // Only include entries that have a review
          not: '',
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
          },
        },
         _count: {
          select: { likedBy: true },
        },
        likedBy: {
          where: { userId: userId || '' },
          select: { userId: true },
        },
      },
      orderBy: {
        createdAt: 'desc', // Order by when the review was created
      },
      take: 10,
    });

    return NextResponse.json(trendingReviews);
  } catch (error) {
    console.error('Failed to fetch trending reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch trending reviews' }, { status: 500 });
  }
}
