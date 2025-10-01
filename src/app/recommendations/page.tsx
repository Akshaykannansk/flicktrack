'use client';

import { useState, useEffect } from 'react';
import type { ViewingHistory } from '@/lib/types';
import { RecommendationsForm } from '@/components/recommendations-form';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Rocket }
 from 'lucide-react';
async function getViewingHistory(): Promise<ViewingHistory[]> {
    const response = await fetch('/api/recommendations/history');
    if (!response.ok) {
        console.error('Failed to fetch viewing history');
        return [];
    }
    return response.json();
}

function LoadingSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="md:col-span-1">
                <div className="sticky top-24 space-y-4">
                    <Skeleton className="h-8 w-48 mb-4" />
                    <ul className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <li key={i}>
                                <Skeleton className="h-12 w-full" />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="md:col-span-2">
                <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
    )
}

export default function RecommendationsPage() {
    const [viewingHistory, setViewingHistory] = useState<ViewingHistory[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsAuthenticated(true);
                const history = await getViewingHistory();
                setViewingHistory(history);
            } else {
                setIsAuthenticated(false);
            }
        };
        checkAuthAndFetch();
    }, []);

    if (isAuthenticated === null) {
        return <LoadingSkeleton />;
    }

    if (!isAuthenticated) {
        return (
             <div className="container mx-auto px-4 py-8 flex justify-center">
                <Alert className="max-w-lg">
                    <Rocket className="h-4 w-4" />
                    <AlertTitle>Please sign in</AlertTitle>
                    <AlertDescription>
                    You need to be signed in to get personalized film recommendations.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (isAuthenticated && viewingHistory.length < 5) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <Alert className="max-w-lg">
                    <Rocket className="h-4 w-4" />
                    <AlertTitle>Not Enough Viewing History</AlertTitle>
                    <AlertDescription>
                    We need at least 5 rated films to generate personalized recommendations. Please rate some films and check back!
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-headline font-bold tracking-tighter">AI-Powered Recommendations</h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
              Discover your next favorite film. Our AI analyzes your viewing history to provide personalized suggestions.
            </p>
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="md:col-span-1">
              <div className="sticky top-24">
                <h2 className="text-2xl font-headline font-semibold mb-4">Your Recent Ratings</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {viewingHistory.map((item, index) => (
                        <li key={index} className="flex justify-between items-center p-2 rounded-lg bg-secondary/50">
                            <span className="truncate font-medium text-foreground pr-4">{item.filmTitle}</span>
                            <span className="font-bold text-primary flex-shrink-0">{'★'.repeat(item.rating)}</span>
                        </li>
                    ))}
                </ul>
              </div>
            </div>
            <div className="md:col-span-2">
              <RecommendationsForm viewingHistory={viewingHistory} />
            </div>
          </div>
        </div>
      );
    }
