'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Rocket } from 'lucide-react';
import { RecommendationResults } from '@/components/recommendation-results';

function LoadingSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto mt-4" />
          </div>
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
                <div key={i}>
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="flex space-x-2 md:space-x-4 overflow-x-auto pb-4">
                        {[...Array(5)].map((_, j) => (
                           <div key={j} className="flex-shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7">
                                <Skeleton key={j} className="h-64 w-full" />
                           </div>
                        ))}
                    </div>
                </div>
            ))}
          </div>
        </div>
    )
}

export default function RecommendationsPage() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
        };
        checkAuth();
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

    return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl">AI-Powered Recommendations</h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-3xl mx-auto">
              Discover your next favorite film. Our AI analyzes your viewing history and preferences to provide personalized suggestions.
            </p>
          </div>
          <RecommendationResults />
        </div>
      );
    }
