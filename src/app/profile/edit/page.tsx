import { FavoriteFilmsForm } from "@/components/favorite-films-form";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Film } from "lucide-react";
import { redirect } from "next/navigation";


async function getInitialFavorites(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { favoriteFilms: true }
    });
    return user?.favoriteFilms ?? [];
}

export default async function EditProfilePage() {
    const { userId } = auth();
    if (!userId) {
        redirect("/sign-in");
    }

    const initialFavorites = await getInitialFavorites(userId);
    const typedFavorites = initialFavorites.map(f => ({
        ...f,
        id: f.id.toString(),
        poster_path: f.posterPath,
        release_date: f.releaseDate ? f.releaseDate.toISOString() : null,
        vote_average: f.voteAverage
    }))

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
             <div className="flex items-center space-x-3">
                <Film className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-headline font-bold tracking-tighter">Edit Favorite Films</h1>
            </div>
            <p className="text-muted-foreground">
                Select your top 4 favorite films to display on your profile. Start typing to search for a film.
            </p>
            <FavoriteFilmsForm initialFavorites={typedFavorites} />
        </div>
    )
}
