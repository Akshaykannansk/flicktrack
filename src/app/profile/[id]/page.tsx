
import { ProfilePageContent } from '@/app/profile/page';
import { notFound, redirect } from 'next/navigation';
import type { PublicUser } from '@/lib/types';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserDataForProfile } from '@/services/userService';

export default async function OtherUserProfilePage({ params }: { params: { id: string } }) {
    const cookieStore = cookies();
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
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;

    if (!currentUser) {
        redirect("/login");
    }

    if (currentUser.id === params.id) {
        redirect("/profile");
    }

    const userData = await getUserDataForProfile(params.id, currentUser.id);

    if (!userData) {
        notFound();
    }

    return <ProfilePageContent 
                user={userData.user as PublicUser} 
                stats={userData.stats} 
                isCurrentUser={userData.isCurrentUser}
                isFollowing={userData.isFollowing}
            />;
}
