
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // User is authenticated with Supabase Auth, now create them in our public users table.
      const { user } = data;

      try {
        const apiResponse = await fetch(`${origin}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata.full_name,
                username: user.user_metadata.username,
                avatar_url: user.user_metadata.avatar_url,
            }),
        });

        if (!apiResponse.ok) {
            // The API route will return a 500 if prisma fails
            const errorBody = await apiResponse.json();
            console.error("Failed to create user in DB:", errorBody);
            // Redirect to an error page with a more specific message
            return NextResponse.redirect(`${origin}/login?error=There was a problem setting up your account.`);
        }

        // If the API call was successful (or user already existed), redirect to the app
        return NextResponse.redirect(`${origin}${next}`);

      } catch (apiError: any) {
        console.error("API call to create user failed:", apiError);
        return NextResponse.redirect(`${origin}/login?error=Could not connect to the server to finalize your account.`);
      }

    }
  }

  // if there's an error from Supabase, or no code
  console.error('Auth callback error:', 'Could not authenticate user with Supabase.');
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
