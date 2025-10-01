'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Film, ViewingHistory } from '@/lib/types';
import { RecommendationsForm } from '@/components/recommendations-form';
import { PlotSearch } from '@/components/plot-search';

async function getViewingHistory(userId: string): Promise<ViewingHistory[]> {
    const supabase = createClient();
    const { data: ratings, error } = await supabase
        .from('ratings')
        .select('rating, films(title)')
        .eq('user_id', userId)
        .not('films', 'is', null)
        // Get the 20 most recent ratings
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching viewing history:', error);
        return [];
    }

    return ratings.map(r => ({
        filmTitle: r.films!.title,
        rating: r.rating,
    }));
}

export default function RecommendationsPage() {
    const [viewingHistory, setViewingHistory] = useState<ViewingHistory[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data, error } = await supabase.auth.getUser();
            if (data.user) {
                setUserId(data.user.id);
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (userId) {
            getViewingHistory(userId).then(setViewingHistory);
        }
    }, [userId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!userId) {
        return <div>Please sign in to get recommendations.</div>;
    }

    if (viewingHistory.length < 5) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Not Enough Viewing History</h1>
                    <p className="text-lg text-muted-foreground">
                        We need at least 5 rated films to generate personalized recommendations. Please rate some films and check back!
                    </p>
                </div>
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
                        <li key={index} className="flex justify-between p-2 rounded-lg bg-secondary">
                            <span>{item.filmTitle}</span>
                            <span className="font-bold text-primary">{'★'.repeat(item.rating)}</span>
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
