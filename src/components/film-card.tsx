import Image from 'next/image';
import Link from 'next/link';
import type { Film } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { IMAGE_BASE_URL } from '@/lib/tmdb';
import { Star } from 'lucide-react';

interface FilmCardProps {
  film: Film;
}

export function FilmCard({ film }: FilmCardProps) {
  const posterUrl = film.poster_path ? `${IMAGE_BASE_URL}w500${film.poster_path}` : 'https://placehold.co/400x600.png';
  const year = film.release_date ? new Date(film.release_date).getFullYear() : 'N/A';

  return (
    <Link href={`/film/${film.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/20 border-2 border-transparent group-hover:border-primary/50 rounded-lg bg-secondary">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative">
            <Image
              src={posterUrl}
              alt={`Poster for ${film.title}`}
              fill
              className="object-cover rounded-md"
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
              data-ai-hint={`${film.title} movie poster`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
          </div>
        </CardContent>
      </Card>
      <div className="mt-2">
         <h3 className="font-semibold text-sm text-primary-foreground truncate group-hover:text-primary transition-colors">{film.title}</h3>
         <p className="text-xs text-muted-foreground">{year}</p>
      </div>
    </Link>
  );
}
