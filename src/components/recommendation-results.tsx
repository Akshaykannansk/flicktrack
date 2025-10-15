'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Film } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Rocket } from 'lucide-react';
import { RecommendationsCarousel } from './recommendations-carousel';

const recommendationSections = [
    { title: 'Because You Liked', key: 'liked' },
    { title: 'From Your Watchlist', key: 'watchlist' },
    { title: 'Based on Your High Ratings', key: 'rated' },
    { title: 'Trending Among Users You Follow', key: 'following' }
];

function SectionSkeleton() {
    return (
        <div>
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="flex space-x-2 md:space-x-4 overflow-x-auto pb-4">
                {[...Array(5)].map((_, j) => (
                    <div key={j} className="flex-shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7">
                         <Skeleton key={j} className="h-64 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function RecommendationResults() {
    const [recommendations, setRecommendations] = useState<Record<string, Film[]>>({});
    const [visibleSections, setVisibleSections] = useState<number>(2);
    const [loading, setLoading] = useState<boolean>(true);
    const [userFilmSets, setUserFilmSets] = useState<{ watchlistIds: Set<number>, likedIds: Set<number> }>({ watchlistIds: new Set(), likedIds: new Set() });

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const [recsResponse, setsResponse] = await Promise.all([
                fetch('/api/recommendations/sections'),
                fetch('/api/user/film-sets')
            ]);

            if (recsResponse.ok) {
                const data = await recsResponse.json();
                setRecommendations(data);
            }

            if (setsResponse.ok) {
                const { watchlistIds, likedIds } = await setsResponse.json();
                setUserFilmSets({ 
                    watchlistIds: new Set(watchlistIds),
                    likedIds: new Set(likedIds),
                });
            }

            setLoading(false);
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 500) {
                if (visibleSections < recommendationSections.length) {
                    setVisibleSections(prev => prev + 1);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [visibleSections]);

    if (loading) {
        return (
            <div className="space-y-8">
                {[...Array(2)].map((_, i) => <SectionSkeleton key={i} />)}
            </div>
        );
    }

    const hasRecommendations = Object.values(recommendations).some(section => section && section.length > 0);

    if (!hasRecommendations) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <Alert className="max-w-lg">
                    <Rocket className="h-4 w-4" />
                    <AlertTitle>Not Enough Data for Recommendations</AlertTitle>
                    <AlertDescription>
                    We need at least 5 films in your history (likes, ratings, watchlist) to generate personalized recommendations. Please interact with some films and check back!
                    </AlertDescription>
                </Alert>
            </div>
        );
    }


    return (
        <div className="space-y-12">
            {recommendationSections.slice(0, visibleSections).map(section => (
                recommendations[section.key] && recommendations[section.key].length > 0 && (
                    <RecommendationsCarousel 
                        key={section.key}
                        title={section.title}
                        films={recommendations[section.key]}
                        watchlistIds={userFilmSets.watchlistIds}
                        likedIds={userFilmSets.likedIds}
                    />
                )
            ))}
            {visibleSections < recommendationSections.length && (
                <SectionSkeleton />
            )}
        </div>
    );
}
