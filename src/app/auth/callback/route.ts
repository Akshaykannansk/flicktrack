
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUserInDatabase } from '@/lib/user';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // If there is an error exchanging the code, log it in detail
    if (error) {
      console.error('Error exchanging code for session:', error.message);
      return NextResponse.redirect(`${origin}/login?error=Authentication failed: ${error.message}`);
    }

    if (data.user) {
      const { user } = data;

      try {
        const result = await createUserInDatabase({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata.full_name,
          username: user.user_metadata.username,
          avatar_url: user.user_metadata.avatar_url,
        });

        if (!result.success) {
            console.error("Failed to create user in DB:", result.message);
            return NextResponse.redirect(`${origin}/login?error=There was a problem setting up your account.`);
        }

        return NextResponse.redirect(`${origin}${next}`);

      } catch (dbError: any) {
        console.error("Database operation failed in callback:", dbError);
        return NextResponse.redirect(`${origin}/login?error=A server error occurred while finalizing your account.`);
      }
    }
  }

  // Generic error if no code is present
  console.error('Auth callback error:', 'No auth code found in the request.');
  return NextResponse.redirect(`${origin}/login?error=Invalid authentication request.`);
}
