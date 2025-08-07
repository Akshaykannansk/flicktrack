
import { FavoriteFilmsForm } from "@/components/favorite-films-form";
import { EditProfileForm } from "@/components/edit-profile-form";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Film, User } from "lucide-react";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";

async function getInitialFavorites(userId: string) {
    const favorites = await prisma.favoriteFilm.findMany({
        where: { userId },
        include: { film: true },
    });
    return favorites.map(item => item.film);
}

async function getInitialProfile(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, username: true, bio: true }
    });
}

export default async function EditProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
