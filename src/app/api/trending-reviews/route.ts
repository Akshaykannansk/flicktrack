
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  const session = await getSession({ cookies: cookies() });
  const user = session?.user;

  try {
    const trendingReviews = await prisma.journalEntry.findMany({
      where: {
        review: {
          not: null,
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
          }
        },
        _count: {
          select: { reviewLikes: true, comments: true }
        },
        reviewLikes: user ? { where: { userId: user.id } } : false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
    
    return NextResponse.json(trendingReviews);
  } catch (error) {
    console.error('Failed to fetch trending reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch trending reviews' }, { status: 500 });
  }
}
