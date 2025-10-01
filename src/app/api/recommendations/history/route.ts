import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server';
import type { ViewingHistory } from '@/lib/types';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { 
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        } 
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { data: journalEntries, error } = await supabase
        .from('JournalEntry')
        .select('rating, film:filmId(title)')
        .eq('userId', user.id)
        .not('film', 'is', null);

    if (error) {
        console.error('Error fetching viewing history:', error);
        return new NextResponse(JSON.stringify({ error: 'Failed to fetch viewing history' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const viewingHistory: ViewingHistory[] = journalEntries
        .filter(r => r.film) // Ensure film data is not null
        .map(r => ({
            filmTitle: r.film[0].title,
            rating: r.rating,
        }));

    return NextResponse.json(viewingHistory);
}
