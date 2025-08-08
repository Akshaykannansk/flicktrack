
import { FavoriteFilmsForm } from "@/components/favorite-films-form";
import { EditProfileForm } from "@/components/edit-profile-form";
import { Film, User } from "lucide-react";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
import type { Film as FilmType } from "@/lib/types";

async function getEditProfileData(userId: string) {
    const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            name: true,
            username: true,
            bio: true,
            favoriteFilms: {
                orderBy: { addedAt: 'asc' },
                include: { film: true }
            }
        }
    });

    if (!userProfile) {
        return { profile: null, initialFavorites: [] };
    }

    const initialFavorites = userProfile.favoriteFilms.map(fav => ({
        ...fav.film,
        id: fav.film.id.toString(),
        release_date: fav.film.release_date?.toISOString() ?? null,
    })) as FilmType[];

    const profile = {
        name: userProfile.name ?? '',
        username: userProfile.username ?? '',
        bio: userProfile.bio ?? ''
    }

    return { profile, initialFavorites };
}


export default async function EditProfilePage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
        cookies: {
            get(name: string) {
            return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
            },
        },
    }
    );
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
        redirect("/login");
    }

    const { profile, initialFavorites } = await getEditProfileData(user.id);
    
    if (!profile) {
        return <div>Could not load profile data.</div>
    }

    return (
        <div className="space-y-12 max-w-2xl mx-auto">
            <div>
                 <div className="flex items-center space-x-3">
                    <User className="w-8 h-8 text-primary" />
                    <h1 className="text-4xl font-headline font-bold tracking-tighter">Edit Profile</h1>
                </div>
                <p className="text-muted-foreground mt-2">
                    Update your public profile information.
                </p>
                <EditProfileForm initialData={profile} />
            </div>
            
            <Separator />
            
            <div>
                 <div className="flex items-center space-x-3">
                    <Film className="w-8 h-8 text-primary" />
                    <h1 className="text-4xl font-headline font-bold tracking-tighter">Edit Favorite Films</h1>
                </div>
                <p className="text-muted-foreground mt-2">
                    Select your top 4 favorite films to display on your profile. Start typing to search for a film.
                </p>
                <FavoriteFilmsForm initialFavorites={initialFavorites} />
            </div>
        </div>
    )
}
