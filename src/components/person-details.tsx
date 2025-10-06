import { PersonDetails as PersonDetailsType } from "@/lib/types";
import { IMAGE_BASE_URL } from "@/lib/tmdb-isomorphic";
import Image from '@/components/CustomImage'
import { Filmography } from "./filmography";

export function PersonDetails({ person }: { person: PersonDetailsType }) {
  const photoUrl = person.profile_path ? `${IMAGE_BASE_URL}w500${person.profile_path}` : 'https://placehold.co/400x600.png';

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg shadow-primary/10">
            <Image
              src={photoUrl}
              alt={`Photo of ${person.name}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
            />
          </div>
        </div>
        <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-headline font-bold tracking-tighter">{person.name}</h1>
            <p className="text-muted-foreground mt-2">{person.known_for_department}</p>
          </div>
          <div>
            <h2 className="text-2xl font-headline font-semibold">Biography</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed max-w-prose">{person.biography || 'No biography available.'}</p>
          </div>
        </div>
      </div>
      <Filmography filmography={person.filmography} />
    </div>
  );
}
