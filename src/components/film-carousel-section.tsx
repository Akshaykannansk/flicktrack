'use client';

import type { Film } from '@/lib/types';
import { FilmCard } from '@/components/film-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface FilmCarouselSectionProps {
    title: string;
    films: Film[];
}

export function FilmCarouselSection({ title, films }: FilmCarouselSectionProps) {
    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-headline font-bold text-primary-foreground tracking-tight">{title}</h2>
            <Carousel opts={{ align: "start", dragFree: true }}>
                <CarouselContent className="-ml-2 md:-ml-4">
                {films.map((film, index) => (
                    <CarouselItem key={index} className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-1/8">
                    <FilmCard film={film} />
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
            </Carousel>
        </section>
    );
}
