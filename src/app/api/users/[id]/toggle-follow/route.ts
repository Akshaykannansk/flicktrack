
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (!currentUserId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data, error } = await supabase
    .from('followers')
    .select('id')
    .eq('user_id', params.id)
    .eq('follower_id', currentUserId)
    .maybeSingle();

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  if (data) {
    await supabase.from('followers').delete().eq('id', data.id);
  } else {
    await supabase.from('followers').insert({ user_id: params.id, follower_id: currentUserId });
  }

  return new NextResponse('OK', { status: 200 });
}
