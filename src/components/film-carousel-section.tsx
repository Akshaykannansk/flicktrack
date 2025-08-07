
'use client';

import * as React from 'react';
import type { Film } from '@/lib/types';
import { FilmCard } from '@/components/film-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { getMoreFilms } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

type FilmCategory = 'popular' | 'top_rated' | 'now_playing';

interface FilmCarouselSectionProps {
    title: string;
    initialFilms: Film[] | null;
    category: FilmCategory;
    watchlistIds: Set<number>;
    likedIds: Set<number>;
}

export function FilmCarouselSection({ title, initialFilms, category, watchlistIds, likedIds }: FilmCarouselSectionProps) {
    const [api, setApi] = React.useState<CarouselApi>();
    const [films, setFilms] = React.useState(initialFilms || []);
    const [page, setPage] = React.useState(2);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(true);

    const fetchNextPage = React.useCallback(async () => {
        if (isLoading || !hasMore) return;
        
        setIsLoading(true);
        const newFilms = await getMoreFilms(category, page);
        
        if (newFilms && newFilms.length > 0) {
            setFilms(prev => [...prev, ...newFilms]);
            setPage(prev => prev + 1);
        } else {
            setHasMore(false);
        }
        setIsLoading(false);
    }, [isLoading, hasMore, category, page]);

    React.useEffect(() => {
        if (!api) return;

        const handleSelect = () => {
            if (!api.canScrollNext() && hasMore) {
                fetchNextPage();
            }
        };

        api.on("select", handleSelect);

        return () => {
            api.off("select", handleSelect);
        };
    }, [api, fetchNextPage, hasMore]);


    if (!initialFilms || initialFilms.length === 0) {
        return (
            <section className="space-y-4">
                 <h2 className="text-2xl font-headline font-bold text-foreground tracking-tight">{title}</h2>
                 <div className="bg-secondary p-8 rounded-lg text-center">
                   <p className="text-muted-foreground">Could not load films. Please try again later.</p>
                 </div>
            </section>
        )
    }

    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-headline font-bold text-foreground tracking-tight">{title}</h2>
            <Carousel 
                opts={{ align: "start", dragFree: true }}
                className="relative"
                setApi={setApi}
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                {films.map((film, index) => {
                    const filmId = parseInt(film.id, 10);
                    return (
                        <CarouselItem key={`${film.id}-${index}`} className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-1/8">
                           <FilmCard 
                                film={film} 
                                isInWatchlist={watchlistIds.has(filmId)}
                                isLiked={likedIds.has(filmId)}
                            />
                        </CarouselItem>
                    )
                })}
                {isLoading && (
                    <CarouselItem className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-1/8">
                         <div className="space-y-2">
                            <Skeleton className="aspect-[2/3] rounded-lg" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                    </CarouselItem>
                )}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-4 z-10" />
                <CarouselNext className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 z-10" />
            </Carousel>
        </section>
    );
}
