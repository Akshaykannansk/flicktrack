import { FilmCard, FilmCardSkeleton } from '@/components/film-card';
import { Button } from '@/components/ui/button';
import type { Film } from '@/lib/types';

interface RecommendationResultsProps {
    recommendations: Film[];
    viewingHistory: { filmTitle: string; rating: number }[];
    onLoadMore: () => Promise<void>;
    isLoadingMore: boolean;
    hasMore: boolean;
    totalRecommendations: number;
}

function generateTitle(viewingHistory: { filmTitle: string; rating: number }[]): string {
    if (viewingHistory.length === 0) {
        return "Critically Acclaimed Films You Might Enjoy";
    }

    const highestRated = viewingHistory.reduce((max, current) => current.rating > max.rating ? current : max, viewingHistory[0]);
    const lowestRated = viewingHistory.reduce((min, current) => current.rating < min.rating ? current : min, viewingHistory[0]);

    if (highestRated.rating >= 4) {
        return `Because you loved ${highestRated.filmTitle}`;
    }

    if (lowestRated.rating <= 2) {
        return `Hoping you'll like these more than ${lowestRated.filmTitle}`;
    }

    return "Top Picks For You";
}

export function RecommendationResults({ 
    recommendations, 
    viewingHistory, 
    onLoadMore, 
    isLoadingMore, 
    hasMore,
    totalRecommendations 
}: RecommendationResultsProps) {
    const title = generateTitle(viewingHistory);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">{title}</h2>
                <p className="text-muted-foreground mt-2">Based on your recent activity, here are {totalRecommendations} films we think you'll love.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recommendations.map(film => (
                    <FilmCard key={film.id} film={film} isInWatchlist={false} isLiked={false} />
                ))}
                {isLoadingMore && [...Array(4)].map((_, i) => <FilmCardSkeleton key={`loading-${i}`} />)}
            </div>

            {hasMore && (
                <div className="text-center">
                    <Button onClick={onLoadMore} disabled={isLoadingMore} size="lg">
                        {isLoadingMore ? 'Loading...' : 'Load More Recommendations'}
                    </Button>
                </div>
            )}
        </div>
    );
}
