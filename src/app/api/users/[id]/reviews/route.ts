
import { NextResponse } from 'next/server';
import { getReviewsForUser } from '@/services/reviewService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const reviews = await getReviewsForUser(params.id);
  return NextResponse.json(reviews);
}
