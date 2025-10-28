'use client';

import type { Film } from '@/lib/types';
import { FilmCard } from '@/components/film-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

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
            <Carousel 
                opts={{ align: "start", containScroll: "trimSnaps" }}
                className="relative"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {films.map(film => (
                        <CarouselItem key={film.id} className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-1/7 2xl:basis-1/8">
                            <FilmCard
                                film={film}
                                isInWatchlist={watchlistIds.has(film.id)}
                                isLiked={likedIds.has(film.id)}
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-4 z-10" />
                <CarouselNext className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 z-10" />
            </Carousel>
        </section>
    );
}
