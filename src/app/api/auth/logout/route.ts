import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Logout successful' });
}
