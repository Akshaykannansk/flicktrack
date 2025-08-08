
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


// The new recommended way for client components
import { createClientComponentClient as _createClientComponentClient } from '@supabase/ssr';

export const createClientComponentClient = _createClientComponentClient;
