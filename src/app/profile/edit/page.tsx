
import { FavoriteFilmsForm } from "@/components/favorite-films-form";
import { EditProfileForm } from "@/components/edit-profile-form";
import { Film, User } from "lucide-react";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getFavoriteFilms } from "@/services/filmService";
import { getUserProfile } from "@/services/userService";

async function getInitialFavorites(userId: string) {
    const favorites = await getFavoriteFilms(userId);
    return favorites.map(item => item.film);
}

async function getInitialProfile(userId: string) {
    return getUserProfile(userId, ['name', 'username', 'bio']);
}

export default async function EditProfilePage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              cookieStore.set({ name, value: '', ...options });
            },
          },
        }
    );
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
        redirect("/login");
    }

    const [initialFavorites, profile] = await Promise.all([
        getInitialFavorites(user.id),
        getInitialProfile(user.id)
    ]);
    
    const typedFavorites = initialFavorites.map(f => ({
        ...f,
        id: f.id.toString(),
        poster_path: f.poster_path,
        release_date: f.release_date?.toISOString() ?? null,
        vote_average: f.vote_average
    }))

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
                <EditProfileForm 
                    initialData={{
                        name: profile?.name ?? '',
                        username: profile?.username ?? '',
                        bio: profile?.bio ?? ''
                    }} 
                />
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
                <FavoriteFilmsForm initialFavorites={typedFavorites} />
            </div>
        </div>
    )
}
