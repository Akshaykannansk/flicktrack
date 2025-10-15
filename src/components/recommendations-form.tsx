'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { getRecommendations } from '@/app/recommendations/actions';
import type { GenerateFilmRecommendationsInput } from '@/ai/flows/generate-film-recommendations';
import type { Film } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RecommendationResults } from '@/components/recommendation-results';
import { searchFilms } from '@/lib/tmdb-server';

interface RecommendationsFormProps {
  viewingHistory: GenerateFilmRecommendationsInput['viewingHistory'];
}

export function RecommendationsForm({ viewingHistory }: RecommendationsFormProps) {
  const [isGenerating, startGeneration] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [detailedRecommendations, setDetailedRecommendations] = useState<Film[]>([]);

  const handleSubmit = async () => {
    startGeneration(async () => {
      setIsLoading(true);
      setDetailedRecommendations([]);
      
      try {
        const result = await getRecommendations({ viewingHistory });
        if (result.recommendations && result.recommendations.length > 0) {
          await fetchFilmDetails(result.recommendations);
        } else {
           toast({
            variant: "destructive",
            title: "No Recommendations Found",
            description: "Our AI couldn't find any recommendations based on your history.",
          });
        }
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "An Error Occurred",
          description: "Failed to generate recommendations. Please try again later.",
        });
      } finally {
         setIsLoading(false);
      }
    });
  };

  const fetchFilmDetails = async (recommendationsToFetch: any[]) => {
    const filmPromises = recommendationsToFetch.map(rec => searchFilms(rec.filmTitle, 1).then(res => res[0]));
    const films = await Promise.all(filmPromises);
    const validFilms = films.filter(film => film) as Film[];
    
    if (validFilms.length === 0) {
        toast({
            variant: "destructive",
            title: "Could Not Find Details",
            description: "We received recommendations, but couldn't find their details.",
        });
    }
    setDetailedRecommendations(validFilms);
  };

  if (detailedRecommendations.length > 0 && !isGenerating) {
      return (
          <RecommendationResults 
              recommendations={detailedRecommendations}
              viewingHistory={viewingHistory}
          />
      )
  }

  return (
    <Card className="h-full flex flex-col min-h-[500px]">
      <CardHeader>
        <CardTitle>AI Recommendations</CardTitle>
        <CardDescription>Click the button to generate your personalized film list.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow items-center justify-center text-center space-y-6 p-6">
        {!isGenerating && (
            <div className="flex flex-col items-center space-y-4">
                <Wand2 className="w-16 h-16 text-primary/50" />
                <Button onClick={handleSubmit} size="lg" disabled={isGenerating}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Recommendations
                </Button>
            </div>
        )}
        
        {isGenerating && (
            <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <p className="text-muted-foreground">Our AI is searching the archives...</p>
            </div>
        )}
        
      </CardContent>
    </Card>
  );
}
