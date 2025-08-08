

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
            // Check if we are near the end of the list to trigger loading more
            const canScrollNext = api.canScrollNext();
            const slidesInView = api.slidesInView().length;
            const totalSlides = api.scrollSnapList().length;
            
            // Load more when the user is about `slidesInView` items from the end
            if (!canScrollNext || api.selectedScrollSnap() >= totalSlides - slidesInView * 2) {
               if (hasMore && !isLoading) {
                 fetchNextPage();
               }
            }
        };

        api.on("select", handleSelect);
        api.on("reInit", handleSelect);


        return () => {
            api.off("select", handleSelect);
            api.off("reInit", handleSelect);
        };
    }, [api, fetchNextPage, hasMore, isLoading]);


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
                opts={{ align: "start", containScroll: "trimSnaps" }}
                className="relative"
                setApi={setApi}
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                {films.map((film, index) => {
                    const filmId = parseInt(film.id, 10);
                    return (
                        <CarouselItem key={`${film.id}-${index}`} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7">
                           <FilmCard 
                                film={film} 
                                isInWatchlist={watchlistIds.has(filmId)}
                                isLiked={likedIds.has(filmId)}
                            />
                        </CarouselItem>
                    )
                })}
                {isLoading && (
                     [...Array(2)].map((_, i) => (
                        <CarouselItem key={`skeleton-${i}`} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7">
                            <div className="space-y-2">
                                <Skeleton className="aspect-[2/3] rounded-lg" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                        </CarouselItem>
                    ))
                )}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-4 z-10" />
                <CarouselNext className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 z-10" />
            </Carousel>
        </section>
    );
}

