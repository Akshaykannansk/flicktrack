
import { NextResponse } from 'next/server';
import { getReviewsForUser } from '@/services/reviewService';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const reviews = await getReviewsForUser(params.userId);
  return NextResponse.json(reviews);
}
