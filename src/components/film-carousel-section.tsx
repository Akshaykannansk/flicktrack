
import type { Film } from '@/lib/types';
import { FilmCard } from '@/components/film-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface FilmCarouselSectionProps {
    title: string;
    filmFetcher: () => Promise<Film[] | null>;
    watchlistIds: Set<number>;
    likedIds: Set<number>;
}

export async function FilmCarouselSection({ title, filmFetcher, watchlistIds, likedIds }: FilmCarouselSectionProps) {
    const films = await filmFetcher();

    if (!films || films.length === 0) {
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
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                {films.map((film, index) => {
                    const filmId = parseInt(film.id, 10);
                    return (
                        <CarouselItem key={index} className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-1/8">
                           <FilmCard 
                                film={film} 
                                isInWatchlist={watchlistIds.has(filmId)}
                                isLiked={likedIds.has(filmId)}
                            />
                        </CarouselItem>
                    )
                })}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-4 z-10" />
                <CarouselNext className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 z-10" />
            </Carousel>
        </section>
    );
}
