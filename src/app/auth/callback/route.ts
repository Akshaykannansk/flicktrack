
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUserInDatabase } from '@/lib/user'; // Import the new function

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { user } = data;

      try {
        // Call the local function directly instead of using fetch
        const result = await createUserInDatabase({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata.full_name,
          username: user.user_metadata.username,
          avatar_url: user.user_metadata.avatar_url,
        });

        if (!result.success) {
            // The local function will have logged the specific prisma error
            console.error("Failed to create user in DB:", result.message);
            return NextResponse.redirect(`${origin}/login?error=There was a problem setting up your account.`);
        }

        // On success or if user already exists, redirect to the app
        return NextResponse.redirect(`${origin}${next}`);

      } catch (dbError: any) {
        console.error("Database operation failed in callback:", dbError);
        return NextResponse.redirect(`${origin}/login?error=A server error occurred while finalizing your account.`);
      }

    }
  }

  console.error('Auth callback error:', 'Could not authenticate user with Supabase.');
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
