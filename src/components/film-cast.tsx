
import { getFilmCredits } from "@/lib/tmdb-server";
import { IMAGE_BASE_URL } from "@/lib/tmdb-isomorphic";
import Image from "next/image";
import Link from "next/link";
import { Film as FilmIcon } from 'lucide-react';
import { Skeleton } from "./ui/skeleton";

export async function CastList({ filmId }: { filmId: string }) {
    const credits = await getFilmCredits(filmId);
    const cast = credits?.cast ?? [];

    if (cast.length === 0) {
        return <p className="text-muted-foreground text-sm">No cast information available.</p>
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {cast.map((actor) => (
            <Link key={actor.id} href={`/person/${actor.id}`} className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                {actor.profile_path ? (
                    <Image
                        src={`${IMAGE_BASE_URL}w185${actor.profile_path}`}
                        alt={actor.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <FilmIcon className="w-6 h-6" />
                    </div>
                )}
                </div>
                <div>
                <p className="font-semibold text-sm">{actor.name}</p>
                <p className="text-xs text-muted-foreground">{actor.character}</p>
                </div>
            </Link>
            ))}
        </div>
    )
}

export function CastListSkeleton() {
    return (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="relative w-12 h-12 rounded-full flex-shrink-0" />
                   <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
        </div>
    )
}
