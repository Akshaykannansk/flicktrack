
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This forces the route to be dynamic and not cached.
export const dynamic = 'force-dynamic';

// This route is public and can be accessed by anyone.
export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    // Fetch the specific setting for the referral system.
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'isReferralSystemEnabled')
      .single();

    // If there's an error or the setting doesn't exist, default to disabled.
    if (error) {
      console.error('Error fetching isReferralSystemEnabled setting:', error.message);
      return NextResponse.json({ isReferralSystemEnabled: false });
    }
    
    // The value is stored as a string ('true' or 'false'), so we parse it to a boolean.
    const isReferralSystemEnabled = data?.value === 'true';

    return NextResponse.json({ isReferralSystemEnabled });

  } catch (err: any) {
    console.error('Unexpected error in /api/settings route:', err.message);
    // Return a server error response
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
