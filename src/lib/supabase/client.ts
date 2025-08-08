
'use client';

import { createBrowserClient } from '@supabase/ssr'

// This function is now deprecated in favor of createClientComponentClient
// but we keep it to avoid breaking other parts of the app during transition.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
