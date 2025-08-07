
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const supabase = createClient();

  try {
    const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

    if (followsError) throw followsError;

    const followingIds = follows.map(f => f.following_id);

    if (followingIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: feedEntries, error: feedError } = await supabase
      .from('journal_entries')
      .select(`
        *,
        films(*),
        users (id, name, username, image_url)
      `)
      .in('user_id', followingIds)
      .order('logged_date', { ascending: false })
      .limit(20);

    if (feedError) throw feedError;

    const responseData = feedEntries.map(entry => ({
      ...entry,
      film: entry.films,
      user: entry.users
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch activity feed:', error);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
  }
}
