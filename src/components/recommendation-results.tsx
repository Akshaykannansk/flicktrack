'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Film } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Rocket } from 'lucide-react';
import { RecommendationsCarousel } from './recommendations-carousel';

const loggedInSections = [
    { title: 'Because You Liked', key: 'liked' },
    { title: 'From Your Watchlist', key: 'watchlist' },
    { title: 'Based on Your High Ratings', key: 'rated' },
    { title: 'Trending Among Users You Follow', key: 'following' },
    { title: 'Trending Now', key: 'trending' }
];

const loggedOutSections = [
    { title: 'Trending Now', key: 'trending' }
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
    const [userFilmSets, setUserFilmSets] = useState<{ watchlistIds: Set<number>, likedIds: Set<number> }>({ watchlistIds: new Set(), likedIds: new Set() });
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [activeSections, setActiveSections] = useState<{title: string, key: string}[]>([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const setsResponse = await fetch('/api/user/film-sets');
                if (setsResponse.ok) {
                    const data = await setsResponse.json();
                    setUserFilmSets({
                        watchlistIds: new Set(data.watchlistIds),
                        likedIds: new Set(data.likedIds),
                    });
                    setIsLoggedIn(true);
                    setActiveSections(loggedInSections);
                } else {
                    setIsLoggedIn(false);
                    setActiveSections(loggedOutSections);
                }
            } catch (error) {
                console.error("Failed to fetch user's film sets, assuming logged out.", error);
                setIsLoggedIn(false);
                setActiveSections(loggedOutSections);
            } finally {
                setIsLoadingInitial(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeSections.length === 0) return;

        const fetchAllSectionsSequentially = async () => {
            for (const section of activeSections) {
                if (recommendations[section.key]) continue;

                try {
                    const recsResponse = await fetch(`/api/recommendations/section?key=${section.key}`);
                    if (recsResponse.ok) {
                        const data = await recsResponse.json();
                        setRecommendations(prev => ({ ...prev, [section.key]: data || [] }));
                    } else {
                        setRecommendations(prev => ({ ...prev, [section.key]: [] }));
                    }
                } catch (error) {
                    console.error(`Failed to fetch recommendation section: ${section.key}`, error);
                    setRecommendations(prev => ({ ...prev, [section.key]: [] }));
                }
            }
        };

        fetchAllSectionsSequentially();
    }, [activeSections, recommendations]);

    if (isLoadingInitial) {
        return (
            <div className="space-y-8">
                {[...Array(2)].map((_, i) => <SectionSkeleton key={i} />)}
            </div>
        );
    }
    
    const hasRecommendations = Object.values(recommendations).some(section => section && section.length > 0);
    const allSectionsAttempted = activeSections.every(section => recommendations[section.key] !== undefined);

    if (allSectionsAttempted && !hasRecommendations) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <Alert className="max-w-lg">
                    <Rocket className="h-4 w-4" />
                    <AlertTitle>Couldn't Find Recommendations For You</AlertTitle>
                    <AlertDescription>
                        {isLoggedIn
                            ? "We need a bit more about your taste to give you personalized recommendations. Try liking some films, adding them to your watchlist, or logging a review."
                            : "Log in to get personalized recommendations based on your taste. For now, check out what's trending!"
                        }
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {activeSections.map(section => {
                const films = recommendations[section.key];

                if (films === undefined) {
                    return <SectionSkeleton key={section.key} />;
                }

                if (films.length === 0) {
                    return null;
                }

                return (
                    <RecommendationsCarousel 
                        key={section.key}
                        title={section.title}
                        films={films}
                        watchlistIds={userFilmSets.watchlistIds}
                        likedIds={userFilmSets.likedIds}
                    />
                );
            })}
        </div>
    );
}
