
import { getFilmCredits } from "@/lib/tmdb-server";
import { IMAGE_BASE_URL } from "@/lib/tmdb-isomorphic";
import Image from '@/components/CustomImage';;
import Link from "next/link";
import { User as UserIcon } from 'lucide-react';
import { Skeleton } from "./ui/skeleton";
import { CrewMember } from "@/lib/types";

export async function CrewList({ filmId }: { filmId: string }) {
    const credits = await getFilmCredits(filmId);
    const crew = credits?.crew.filter(c => ["Director", "Screenplay", "Director of Photography", "Producer"].includes(c.job)).slice(0, 10) ?? [];

    if (crew.length === 0) {
        return <p className="text-muted-foreground text-sm">No crew information available.</p>
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {crew.map((person) => (
            <Link key={`${person.id}-${person.job}`} href={`/person/${person.id}`} className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                {person.profile_path ? (
                    <Image
                        src={`${IMAGE_BASE_URL}w185${person.profile_path}`}
                        alt={person.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <UserIcon className="w-6 h-6" />
                    </div>
                )}
                </div>
                <div>
                <p className="font-semibold text-sm">{person.name}</p>
                <p className="text-xs text-muted-foreground">{person.job}</p>
                </div>
            </Link>
            ))}
        </div>
    )
}

export function CrewListSkeleton() {
    return (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
              {[...Array(4)].map((_, i) => (
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
