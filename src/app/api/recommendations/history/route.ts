import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { ViewingHistory } from '@/lib/types';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: ratings, error } = await supabase
    .from('ratings')
    .select('rating, films(title)')
    .eq('user_id', user.id)
    .not('films', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching viewing history:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch viewing history' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

    const viewingHistory: ViewingHistory[] = ratings
        .filter(r => r.films) // Ensure film data is not null
        .map(r => ({
            filmTitle: r.films!.title,
            rating: r.rating,
    }));

  return NextResponse.json(viewingHistory);
}
