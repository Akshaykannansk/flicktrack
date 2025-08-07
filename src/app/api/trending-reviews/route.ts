
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  const { userId } = auth();
  const supabase = createClient();

  try {
    const query = supabase
      .from('journal_entries_with_counts')
      .select('*')
      .not('review', 'is', null)
      .neq('review', '')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (userId) {
        query.select('*, liked_by_user:review_likes!inner(user_id)');
    }

    const { data: trendingReviews, error } = await query;
    
    if (error) throw error;

    return NextResponse.json(trendingReviews);
  } catch (error) {
    console.error('Failed to fetch trending reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch trending reviews' }, { status: 500 });
  }
}
