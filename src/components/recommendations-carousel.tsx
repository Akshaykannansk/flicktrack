'use client';

import type { Film } from '@/lib/types';
import { FilmCard } from '@/components/film-card';

interface RecommendationsCarouselProps {
    title: string;
    films: Film[];
    watchlistIds: Set<number>;
    likedIds: Set<number>;
}

export function RecommendationsCarousel({ title, films, watchlistIds, likedIds }: RecommendationsCarouselProps) {
    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-headline font-bold text-foreground tracking-tight">{title}</h2>
            <div className="flex space-x-2 md:space-x-4 overflow-x-auto pb-4">
                {films.map(film => (
                    <div key={film.id} className="flex-shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7">
                        <FilmCard
                            film={film}
                            isInWatchlist={watchlistIds.has(film.id)}
                            isLiked={likedIds.has(film.id)}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
