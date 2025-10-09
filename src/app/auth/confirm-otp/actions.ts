
'use server';

import { createUserInDatabase } from '@/lib/user';

interface UserDetails {
    id: string;
    email: string;
    full_name: string;
    username: string;
    avatar_url: string;
}

export async function createUserRecord(userDetails: UserDetails) {
    try {
        const result = await createUserInDatabase(userDetails);
        return result;
    } catch (error: any) {
        console.error('Error in createUserRecord server action:', error.message);
        return { success: false, message: 'An internal error occurred.' };
    }
}
