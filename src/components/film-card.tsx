import Image from 'next/image';
import Link from 'next/link';
import type { Film } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface FilmCardProps {
  film: Film;
}

export function FilmCard({ film }: FilmCardProps) {
  return (
    <Link href={`/film/${film.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/20 border-0 rounded-lg">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative">
            <Image
              src={film.posterUrl}
              alt={`Poster for ${film.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              data-ai-hint={`${film.title} movie poster`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
              <h3 className="font-headline text-base font-bold leading-tight ">{film.title}</h3>
              <div className="flex items-center mt-1">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="ml-1 text-xs font-semibold">{film.averageRating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
