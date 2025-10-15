
import { NextResponse } from 'next/server';
import { getJournalEntryWithDetails } from '@/services/reviewService';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const entry = await getJournalEntryWithDetails(params.id);

    if (!entry) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to fetch review details:', error);
    return NextResponse.json({ error: 'Failed to fetch review details' }, { status: 500 });
  }
}
